import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')
    );

    // Only handle payment_intent.succeeded
    if (event.type !== 'payment_intent.succeeded') {
      return Response.json({ success: true });
    }

    const base44 = createClientFromRequest(req);
    const paymentIntent = event.data.object;
    
    // Get metadata from either checkout session or payment intent
    let metadata = paymentIntent.metadata;
    if (!metadata.eventId && paymentIntent.client_secret) {
      // Try to get from checkout session
      const sessions = await stripe.checkout.sessions.list({ limit: 1 });
      const session = sessions.data.find(s => s.payment_intent === paymentIntent.id);
      metadata = session?.metadata || metadata;
    }
    
    const { eventId, ticketTypeId, quantity, buyerId, promoterId } = metadata;

    // Create ticket order
    const orderNumber = `ORD-${Date.now()}`;
    const subtotal = (paymentIntent.amount_received / 100) * 0.952; // Remove platform fee
    const platformFee = paymentIntent.amount_received / 100 - subtotal;

    const ticketOrder = await base44.entities.TicketOrder.create({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      buyer_id: buyerId,
      buyer_email: paymentIntent.receipt_email,
      buyer_name: paymentIntent.billing_details?.name || 'Customer',
      quantity: parseInt(quantity),
      subtotal,
      platform_fee: platformFee,
      total_amount: paymentIntent.amount_received / 100,
      payment_status: 'completed',
      payment_intent_id: paymentIntent.id,
      order_number: orderNumber,
    });

    // Generate unique ticket codes
    const tickets = [];
    for (let i = 0; i < parseInt(quantity); i++) {
      const uniqueCode = `${eventId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      tickets.push({
        order_id: ticketOrder.id,
        ticket_type_id: ticketTypeId,
        event_id: eventId,
        owner_id: buyerId,
        owner_email: paymentIntent.receipt_email,
        unique_code: uniqueCode,
        ticket_number: `Ticket #${i + 1} of ${quantity}`,
      });
    }

    // Bulk create tickets
    await base44.entities.Ticket.bulkCreate(tickets);

    // Update ticket type sold count
    const ticketTypeResults = await base44.entities.TicketType.filter({ id: ticketTypeId });
    const ticketType = ticketTypeResults[0];
    await base44.entities.TicketType.update(ticketTypeId, {
      quantity_sold: (ticketType.quantity_sold || 0) + parseInt(quantity),
    });

    // Create ticket sale record for commission tracking
    if (promoterId) {
      const promoterResults = await base44.entities.Promoter.filter({ promoter_id: promoterId, event_id: eventId });
      const promoter = promoterResults[0];
      if (promoter) {
        const commissionAmount = subtotal * (promoter.commission_rate / 100);
        await base44.entities.TicketSale.create({
          order_id: ticketOrder.id,
          event_id: eventId,
          ticket_type_id: ticketTypeId,
          sold_by_promoter_id: promoterId,
          sold_by_promoter_name: promoter.promoter_name,
          quantity: parseInt(quantity),
          unit_price: ticketType.price,
          total_amount: subtotal,
          commission_rate: promoter.commission_rate,
          commission_amount: commissionAmount,
          sale_date: new Date().toISOString(),
        });

        // Update promoter stats
        await base44.entities.Promoter.update(promoter.id, {
          total_tickets_sold: (promoter.total_tickets_sold || 0) + parseInt(quantity),
          total_commission_earned: (promoter.total_commission_earned || 0) + commissionAmount,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});