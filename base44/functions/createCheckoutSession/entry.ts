import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// Planet Baltimore fee structure
const SERVICE_FEE_PER_TICKET = 0.65; // flat service fee per ticket (Planet Baltimore)
const BALTIMORE_TAX_RATE = 0.06;     // 6% Baltimore tax on ticket price (Planet Baltimore)

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId, festivalId, ticketTypeId, quantity, promoterId, promoCodeId } = await req.json();

    if ((!eventId && !festivalId) || !ticketTypeId || !quantity || quantity < 1) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch event or festival (the ticket's parent) and derive product details
    let organizerId = null;
    let productName = '';
    let productImage = '';
    let productDesc = '';
    let cancelPath = '';
    if (festivalId) {
      const festResults = await base44.asServiceRole.entities.Festival.filter({ id: festivalId });
      const festival = festResults[0];
      if (!festival) return Response.json({ error: 'Festival not found' }, { status: 404 });
      organizerId = festival.owner_id;
      productName = festival.name;
      productImage = festival.image_url || '';
      productDesc = festival.description || '';
      cancelPath = festival.slug ? `/festivals/${festival.slug}` : '/festivals';
    } else {
      const eventResults = await base44.asServiceRole.entities.Event.filter({ id: eventId });
      const event = eventResults[0];
      if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
      organizerId = event.organizer_id;
      productName = event.title;
      productImage = event.image_url || '';
      productDesc = event.description || '';
      cancelPath = `/events/${eventId}/tickets`;
    }

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

    const baseUnitPrice = ticketType.price || 0;

    // Look up artist's Stripe Connect Account ID if this is a paid ticket
    let stripeConnectId = null;
    if (baseUnitPrice > 0) {
      const artistPages = await base44.asServiceRole.entities.ArtistPage.filter({ owner_id: organizerId });
      const artistPage = artistPages[0];
      stripeConnectId = artistPage?.stripe_connect_id || null;

      if (!stripeConnectId) {
        return Response.json({
          error: 'This event organizer has not connected their Stripe account. Ticket sales are unavailable until the organizer sets up payment in their Artist Profile → Stripe Setup.',
          code: 'STRIPE_NOT_CONFIGURED'
        }, { status: 400 });
      }
    }

    // Apply promo code discount to base price only
    let discountAmount = 0;
    if (promoCodeId) {
      const promoResults = await base44.asServiceRole.entities.PromoCode.filter({ id: promoCodeId, is_active: true });
      const promo = promoResults[0];
      if (promo) {
        const now = new Date();
        if ((!promo.valid_from || new Date(promo.valid_from) <= now) &&
            (!promo.valid_until || new Date(promo.valid_until) >= now) &&
            (!promo.usage_limit || (promo.usage_count || 0) < promo.usage_limit)) {
          const subtotalForDiscount = baseUnitPrice * quantity;
          if (promo.discount_type === 'percentage') {
            discountAmount = subtotalForDiscount * (promo.discount_value / 100);
          } else {
            discountAmount = Math.min(promo.discount_value, subtotalForDiscount);
          }
          await base44.asServiceRole.entities.PromoCode.update(promo.id, {
            usage_count: (promo.usage_count || 0) + 1,
          });
        }
      }
    }

    // Discounted ticket price (what artist receives per ticket)
    const discountedSubtotal = Math.max(0, baseUnitPrice * quantity - discountAmount);
    const discountedUnitPrice = discountedSubtotal / quantity;

    // Platform fees per ticket
    const taxPerTicket = discountedUnitPrice * BALTIMORE_TAX_RATE;
    const totalPerTicket = discountedUnitPrice + SERVICE_FEE_PER_TICKET + taxPerTicket;
    const totalAmount = totalPerTicket * quantity;
    const totalCents = Math.round(totalAmount * 100);

    // Platform keeps: service fee + tax (embedded in total, not shown separately to user)
    const platformFeeCents = Math.round((SERVICE_FEE_PER_TICKET + taxPerTicket) * quantity * 100);

    // Free ticket — skip Stripe
    if (totalCents === 0) {
      const orderNumber = `ORD-FREE-${Date.now()}`;
      const order = await base44.asServiceRole.entities.TicketOrder.create({
        event_id: eventId || '',
        festival_id: festivalId || '',
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
          event_id: eventId || '',
          festival_id: festivalId || '',
          owner_id: user.id,
          owner_email: user.email,
          unique_code: `TKT-${(eventId || festivalId).slice(0, 6).toUpperCase()}-FREE-${Date.now()}-${i}`,
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

    // Paid ticket — create Stripe Checkout session
    const origin = req.headers.get('origin') || 'https://planetbaltimore.base44.app';
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${productName} — ${ticketType.name}`,
            description: ticketType.description || productDesc || '',
            images: productImage ? [productImage] : [],
          },
          unit_amount: Math.round(totalPerTicket * 100),
        },
        quantity,
      },
    ];

    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: user.email,
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata: {
        eventId: eventId || '',
        festivalId: festivalId || '',
        ticketTypeId,
        quantity: quantity.toString(),
        buyerId: user.id,
        promoterId: promoterId || '',
        promoCodeId: promoCodeId || '',
      },
      billing_address_collection: 'required',
    };

    // Route artist's portion to their Stripe account via Connect
    if (stripeConnectId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: stripeConnectId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});