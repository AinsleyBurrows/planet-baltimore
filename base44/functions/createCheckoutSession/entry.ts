import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COMMISSION_PERCENTAGE = 5;
const COMMISSION_FLAT_FEE = 0.50;

function flattenForStripe(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        const arrKey = `${newKey}[${idx}]`;
        if (typeof item === 'object') {
          Object.assign(result, flattenForStripe(item, arrKey));
        } else {
          result[arrKey] = item;
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenForStripe(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

Deno.serve(async (req) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return Response.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { event_id, ticket_type_id, quantity, promo_code } = await req.json();
    if (!event_id || !ticket_type_id || !quantity || quantity < 1) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Fetch event
    const events = await base44.asServiceRole.entities.Event.filter({ id: event_id });
    if (!events.length) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }
    const event = events[0];

    // Fetch ticket type
    const ticketTypes = await base44.asServiceRole.entities.TicketType.filter({ id: ticket_type_id });
    if (!ticketTypes.length) {
      return Response.json({ error: 'Ticket type not found' }, { status: 404 });
    }
    const ticketType = ticketTypes[0];

    if (ticketType.event_id !== event_id) {
      return Response.json({ error: 'Invalid ticket type' }, { status: 400 });
    }

    // Validate availability
    const now = new Date();
    if (!ticketType.is_active) {
      return Response.json({ error: 'Ticket type not on sale' }, { status: 400 });
    }

    if (ticketType.sale_start_date && new Date(ticketType.sale_start_date) > now) {
      return Response.json({ error: 'Sales not started' }, { status: 400 });
    }

    if (ticketType.sale_end_date && new Date(ticketType.sale_end_date) < now) {
      return Response.json({ error: 'Sales ended' }, { status: 400 });
    }

    if (ticketType.early_bird_expiry_date && new Date(ticketType.early_bird_expiry_date) < now) {
      return Response.json({ error: 'Early bird expired' }, { status: 400 });
    }

    const available = (ticketType.quantity_total || 0) - (ticketType.quantity_sold || 0);
    if (available < quantity) {
      return Response.json({ error: `Only ${available} available` }, { status: 400 });
    }

    if (ticketType.max_per_buyer && quantity > ticketType.max_per_buyer) {
      return Response.json({ error: `Max ${ticketType.max_per_buyer} per buyer` }, { status: 400 });
    }

    // Calculate pricing
    let subtotal = ticketType.price * quantity;
    let discount = 0;

    if (promo_code) {
      const codes = await base44.asServiceRole.entities.PromoCode.filter({ code: promo_code.toUpperCase() });
      if (codes.length) {
        const code = codes[0];
        if (!code.is_active || (code.usage_limit && code.usage_count >= code.usage_limit)) {
          return Response.json({ error: 'Invalid promo code' }, { status: 400 });
        }

        if (code.discount_type === 'percentage') {
          discount = (subtotal * code.discount_value) / 100;
        } else {
          discount = code.discount_value * quantity;
        }
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const platformFee = (discountedSubtotal * COMMISSION_PERCENTAGE / 100) + (COMMISSION_FLAT_FEE * quantity);
    const taxes = discountedSubtotal * 0.08;
    const totalAmount = discountedSubtotal + taxes + platformFee;

    // Create order record
    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const order = await base44.asServiceRole.entities.TicketOrder.create({
      event_id,
      ticket_type_id,
      buyer_id: user.id,
      buyer_email: user.email,
      buyer_name: user.full_name,
      quantity,
      subtotal: discountedSubtotal,
      taxes,
      platform_fee: platformFee,
      discount_applied: discount,
      total_amount: totalAmount,
      payment_status: 'pending',
      order_number: orderNumber,
      promo_code_used: promo_code || null,
    });

    // Build Stripe session params
    const params = new URLSearchParams();
    params.append('payment_method_types[0]', 'card');
    params.append('customer_email', user.email);
    
    params.append('line_items[0][price_data][currency]', 'usd');
    params.append('line_items[0][price_data][product_data][name]', `${event.title} - ${ticketType.name}`);
    params.append('line_items[0][price_data][unit_amount]', Math.round(discountedSubtotal * 100 / quantity));
    params.append('line_items[0][quantity]', quantity.toString());

    params.append('line_items[1][price_data][currency]', 'usd');
    params.append('line_items[1][price_data][product_data][name]', 'Platform Fee');
    params.append('line_items[1][price_data][unit_amount]', Math.round(platformFee * 100));
    params.append('line_items[1][quantity]', '1');

    params.append('line_items[2][price_data][currency]', 'usd');
    params.append('line_items[2][price_data][product_data][name]', 'Tax');
    params.append('line_items[2][price_data][unit_amount]', Math.round(taxes * 100));
    params.append('line_items[2][quantity]', '1');

    params.append('mode', 'payment');
    params.append('success_url', `${Deno.env.get('APP_URL')}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${Deno.env.get('APP_URL')}/events/${event_id}`);
    params.append('metadata[event_id]', event_id);
    params.append('metadata[order_id]', order.id);
    params.append('metadata[buyer_id]', user.id);

    // Create Stripe session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Stripe error');
    }

    const session = await response.json();

    return Response.json({
      checkout_url: session.url,
      session_id: session.id,
      order_id: order.id,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});