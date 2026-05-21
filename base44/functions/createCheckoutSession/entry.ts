import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId, ticketTypeId, quantity, promoterId, promoCodeId } = await req.json();

    if (!eventId || !ticketTypeId || !quantity || quantity < 1) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch event and ticket type
    const eventResults = await base44.asServiceRole.entities.Event.filter({ id: eventId });
    const event = eventResults[0];
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    const ttResults = await base44.asServiceRole.entities.TicketType.filter({ id: ticketTypeId });
    const ticketType = ttResults[0];
    if (!ticketType) return Response.json({ error: 'Ticket type not found' }, { status: 404 });

    // Check availability
    const available = (ticketType.quantity_total || 0) - (ticketType.quantity_sold || 0);
    if (quantity > available) {
      return Response.json({ error: `Only ${available} tickets remaining` }, { status: 400 });
    }

    // Check per-buyer limit
    if (ticketType.max_per_buyer && quantity > ticketType.max_per_buyer) {
      return Response.json({ error: `Max ${ticketType.max_per_buyer} per buyer` }, { status: 400 });
    }

    // Calculate pricing
    let unitPrice = ticketType.price || 0;
    let discountAmount = 0;

    // Apply promo code if provided
    if (promoCodeId) {
      const promoResults = await base44.asServiceRole.entities.PromoCode.filter({ id: promoCodeId, is_active: true });
      const promo = promoResults[0];
      if (promo) {
        const now = new Date();
        if ((!promo.valid_from || new Date(promo.valid_from) <= now) &&
            (!promo.valid_until || new Date(promo.valid_until) >= now) &&
            (!promo.usage_limit || (promo.usage_count || 0) < promo.usage_limit)) {
          const subtotalForDiscount = unitPrice * quantity;
          if (promo.discount_type === 'percentage') {
            discountAmount = subtotalForDiscount * (promo.discount_value / 100);
          } else {
            discountAmount = Math.min(promo.discount_value, subtotalForDiscount);
          }
          // Increment usage count
          await base44.asServiceRole.entities.PromoCode.update(promo.id, {
            usage_count: (promo.usage_count || 0) + 1,
          });
        }
      }
    }

    const subtotal = unitPrice * quantity;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const platformFee = discountedSubtotal * 0.05;
    const totalAmount = discountedSubtotal + platformFee;
    const totalCents = Math.round(totalAmount * 100);

    // Free ticket — skip Stripe
    if (totalCents === 0) {
      const orderNumber = `ORD-FREE-${Date.now()}`;
      const order = await base44.asServiceRole.entities.TicketOrder.create({
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        buyer_id: user.id,
        buyer_email: user.email,
        buyer_name: user.full_name,
        quantity,
        subtotal: 0,
        platform_fee: 0,
        total_amount: 0,
        payment_status: 'completed',
        payment_intent_id: `free_${Date.now()}`,
        order_number: orderNumber,
        promo_code_used: promoterId || '',
      });

      const ticketBatch = [];
      for (let i = 0; i < quantity; i++) {
        ticketBatch.push({
          order_id: order.id,
          ticket_type_id: ticketTypeId,
          event_id: eventId,
          owner_id: user.id,
          owner_email: user.email,
          unique_code: `TKT-${eventId.slice(0, 6).toUpperCase()}-FREE-${Date.now()}-${i}`,
          ticket_number: `${i + 1} of ${quantity}`,
          is_checked_in: false,
        });
      }
      await base44.asServiceRole.entities.Ticket.bulkCreate(ticketBatch);
      await base44.asServiceRole.entities.TicketType.update(ticketTypeId, {
        quantity_sold: (ticketType.quantity_sold || 0) + quantity,
      });

      return Response.json({ success: true, free: true, orderId: order.id });
    }

    // Paid ticket — create Stripe session
    const origin = req.headers.get('origin') || 'https://planetbaltimore.base44.app';
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${event.title} — ${ticketType.name}`,
            description: ticketType.description || event.description || '',
            images: event.image_url ? [event.image_url] : [],
          },
          unit_amount: Math.round(((discountedSubtotal / quantity) + platformFee / quantity) * 100),
        },
        quantity,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: user.email,
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/events/${eventId}/tickets`,
      metadata: {
        eventId,
        ticketTypeId,
        quantity: quantity.toString(),
        buyerId: user.id,
        promoterId: promoterId || '',
        promoCodeId: promoCodeId || '',
      },
      billing_address_collection: 'required',
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});