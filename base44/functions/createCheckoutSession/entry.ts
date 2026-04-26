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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, ticketTypeId, quantity, promoterId } = await req.json();

    if (!eventId || !ticketTypeId || !quantity || quantity < 1) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch event, ticket type, and user data
    const eventResults = await base44.entities.Event.filter({ id: eventId });
    const event = eventResults[0];
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    const ticketTypeResults = await base44.entities.TicketType.filter({ id: ticketTypeId });
    const ticketType = ticketTypeResults[0];
    if (!ticketType) {
      return Response.json({ error: 'Ticket type not found' }, { status: 404 });
    }

    // Validate availability
    const available = (ticketType.quantity_total || 0) - (ticketType.quantity_sold || 0);
    if (quantity > available) {
      return Response.json({ error: 'Not enough tickets available' }, { status: 400 });
    }

    // Calculate pricing
    const subtotal = ticketType.price * quantity;
    const platformFee = subtotal * 0.05; // 5% platform fee
    const totalAmount = Math.round((subtotal + platformFee) * 100); // Convert to cents

    // Create Stripe checkout session with automatic tax calculation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/events/${eventId}`,
      customer_email: user.email,
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      metadata: {
        eventId,
        ticketTypeId,
        quantity: quantity.toString(),
        buyerId: user.id,
        promoterId: promoterId || '',
        eventCity: event.address || event.neighborhood_name || '',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${event.title} - ${ticketType.name}`,
              description: ticketType.description || '',
              images: event.image_url ? [event.image_url] : [],
              tax_code: 'txcd_100000000',
            },
            unit_amount: Math.round(ticketType.price * 100),
          },
          quantity,
        },
      ],
    });

    return Response.json({ sessionId: session.id, clientSecret: session.client_secret });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});