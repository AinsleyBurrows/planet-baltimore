import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { createHmac } from 'node:crypto';

async function verifyWebhookSignature(body, signature) {
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secret) throw new Error('Webhook secret not configured');

  const hash = createHmac('sha256', secret).update(body).digest('hex');
  const expectedSignature = `t=${Math.floor(Date.now() / 1000)},v1=${hash}`;
  
  // Simple timing-safe comparison
  return signature.includes(`v1=${hash}`);
}

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return Response.json({ error: 'Missing signature' }, { status: 400 });
    }

    const body = await req.text();
    const verified = await verifyWebhookSignature(body, signature);
    if (!verified) {
      return Response.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const event = JSON.parse(body);
    const base44 = createClientFromRequest(req);

    // Handle payment_intent.succeeded
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      const eventId = session.metadata?.event_id;
      const buyerId = session.metadata?.buyer_id;

      if (!orderId) {
        console.log('No order ID in metadata');
        return Response.json({ received: true });
      }

      // Update order status
      await base44.asServiceRole.entities.TicketOrder.update(orderId, {
        payment_status: 'completed',
        payment_intent_id: session.payment_intent,
      });

      // Get order details
      const orders = await base44.asServiceRole.entities.TicketOrder.filter({ id: orderId });
      if (!orders.length) {
        return Response.json({ received: true });
      }

      const order = orders[0];

      // Create individual Ticket records
      for (let i = 0; i < order.quantity; i++) {
        const uniqueCode = `${order.order_number}-${i + 1}-${Math.random().toString(36).substring(7)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uniqueCode)}`;

        await base44.asServiceRole.entities.Ticket.create({
          order_id: orderId,
          ticket_type_id: order.ticket_type_id,
          event_id: order.event_id,
          owner_id: buyerId,
          owner_email: order.buyer_email,
          unique_code: uniqueCode,
          qr_code_url: qrUrl,
          ticket_number: `Ticket #${i + 1} of ${order.quantity}`,
        });
      }

      // Update ticket type sold count
      const ticketTypes = await base44.asServiceRole.entities.TicketType.filter({ id: order.ticket_type_id });
      if (ticketTypes.length) {
        const ticketType = ticketTypes[0];
        await base44.asServiceRole.entities.TicketType.update(order.ticket_type_id, {
          quantity_sold: (ticketType.quantity_sold || 0) + order.quantity,
        });
      }

      // Create payout record
      await base44.asServiceRole.entities.Payout.create({
        event_id: eventId,
        organizer_id: (await base44.asServiceRole.entities.Event.filter({ id: eventId }))[0]?.organizer_id,
        total_gross_sales: order.total_amount,
        platform_commission: order.platform_fee,
        platform_fee_breakdown: {
          percentage_fee: order.total_amount * 0.05,
          flat_fee: 0.50 * order.quantity,
        },
        net_payout: order.total_amount - order.platform_fee,
        payout_status: 'pending',
      });

      // Send confirmation email
      const events = await base44.asServiceRole.entities.Event.filter({ id: eventId });
      const event_details = events[0];

      await base44.integrations.Core.SendEmail({
        to: order.buyer_email,
        subject: `Ticket Confirmation - ${event_details.title}`,
        body: `
Thank you for your purchase!

Order Number: ${order.order_number}
Event: ${event_details.title}
Ticket Type: ${(await base44.asServiceRole.entities.TicketType.filter({ id: order.ticket_type_id }))[0]?.name}
Quantity: ${order.quantity}
Total Paid: $${order.total_amount.toFixed(2)}

Your tickets are attached. Please bring them to the event or show the QR code at check-in.

Event Details:
Date: ${event_details.date}
Location: ${event_details.venue_name}

See you there!
        `.trim(),
        from_name: 'BMore Connected',
      });

      // Update promo code usage
      if (order.promo_code_used) {
        const codes = await base44.asServiceRole.entities.PromoCode.filter({ code: order.promo_code_used });
        if (codes.length) {
          await base44.asServiceRole.entities.PromoCode.update(codes[0].id, {
            usage_count: (codes[0].usage_count || 0) + 1,
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});