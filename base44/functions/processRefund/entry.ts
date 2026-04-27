import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    // Handle both direct API calls and automation triggers
    const isAutomation = body.event && body.data;
    const eventId = isAutomation ? body.data.id : null;
    const { orderId, refundReason, refundAmount } = body;

    // If triggered from automation, refund all orders for the cancelled event
    if (isAutomation && eventId) {
      const orders = await base44.asServiceRole.entities.TicketOrder.filter({ event_id: eventId, payment_status: 'completed' });
      
      let refundedCount = 0;
      for (const order of orders) {
        try {
          const refundAmount_cents = Math.round((order.total_amount) * 100);
          await stripe.refunds.create({
            payment_intent: order.payment_intent_id,
            amount: refundAmount_cents,
            reason: 'requested_by_customer',
          });

          await base44.asServiceRole.entities.TicketOrder.update(order.id, {
            refund_status: 'full',
            refund_reason: 'Event cancelled by organizer',
            refund_amount: order.total_amount,
            payment_status: 'refunded',
          });

          // Send email to buyer
          await base44.integrations.Core.SendEmail({
            to: order.buyer_email,
            subject: 'Event Cancelled - Full Refund Processed',
            body: `We're sorry, but the event you purchased tickets for has been cancelled.\n\nA full refund of $${(order.total_amount).toFixed(2)} has been issued to your account. The funds will appear within 3-5 business days.\n\nOrder #${order.order_number}`,
            from_name: 'Planet Baltimore',
          });

          refundedCount++;
        } catch (error) {
          console.error(`Failed to refund order ${order.id}:`, error);
        }
      }

      return Response.json({ success: true, message: `${refundedCount} orders refunded` });
    }

    // Direct API call
    if (!orderId) {
      return Response.json({ error: 'Missing order ID' }, { status: 400 });
    }

    if (!orderId) {
      return Response.json({ error: 'Missing order ID' }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the ticket order
    const orderResults = await base44.entities.TicketOrder.filter({ id: orderId });
    if (orderResults.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResults[0];

    // Verify authorization (user is organizer)
    const eventResults = await base44.entities.Event.filter({ id: order.event_id });
    const event = eventResults[0];
    if (!event || event.organizer_id !== user.id) {
      return Response.json({ error: 'Unauthorized - you do not own this event' }, { status: 403 });
    }

    // Check if already refunded
    if (order.refund_status === 'full') {
      return Response.json({ error: 'Order already fully refunded' }, { status: 400 });
    }

    // Process refund with Stripe
    const refundAmount_cents = Math.round((refundAmount || order.total_amount) * 100);
    const stripeRefund = await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
      amount: refundAmount_cents,
      reason: refundReason || 'requested_by_customer',
    });

    // Update order with refund info
    const newRefundStatus = (refundAmount || order.total_amount) >= order.total_amount ? 'full' : 'partial';
    await base44.entities.TicketOrder.update(orderId, {
      refund_status: newRefundStatus,
      refund_reason: refundReason || 'Customer requested refund',
      refund_amount: refundAmount || order.total_amount,
      payment_status: 'refunded',
    });

    // Send refund confirmation email
    await base44.integrations.Core.SendEmail({
      to: order.buyer_email,
      subject: `Refund Processed - ${event.title}`,
      body: `Your refund of $${(refundAmount || order.total_amount).toFixed(2)} has been processed. The funds will appear in your account within 3-5 business days.\n\nOrder #${order.order_number}\nReason: ${refundReason || 'N/A'}`,
      from_name: 'Planet Baltimore',
    });

    // Send organizer notification
    const organizerResults = await base44.entities.User.get(event.organizer_id);
    if (organizerResults?.email) {
      await base44.integrations.Core.SendEmail({
        to: organizerResults.email,
        subject: `Refund Issued - ${event.title}`,
        body: `A refund of $${(refundAmount || order.total_amount).toFixed(2)} has been issued to ${order.buyer_email}.\n\nOrder #${order.order_number}\nReason: ${refundReason || 'N/A'}`,
        from_name: 'Planet Baltimore',
      });
    }

    return Response.json({
      success: true,
      refundId: stripeRefund.id,
      refundAmount: refundAmount || order.total_amount,
      refundStatus: newRefundStatus,
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});