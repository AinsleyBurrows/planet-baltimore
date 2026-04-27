import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const { code, eventId, ticketTypeId, quantity } = await req.json();

    if (!code || !eventId || !quantity || quantity < 1) {
      return Response.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // Find promo code
    const promoCodes = await base44.entities.PromoCode.filter(
      { code: code.toUpperCase(), is_active: true },
      '-created_date',
      1
    );

    if (promoCodes.length === 0) {
      return Response.json({ error: 'Promo code not found or inactive' }, { status: 404 });
    }

    const promo = promoCodes[0];

    // Validate event eligibility
    if (promo.event_id && promo.event_id !== eventId) {
      return Response.json({ error: 'Promo code not valid for this event' }, { status: 400 });
    }

    // Validate ticket type eligibility
    if (promo.ticket_type_whitelist && promo.ticket_type_whitelist.length > 0) {
      if (!promo.ticket_type_whitelist.includes(ticketTypeId)) {
        return Response.json({ error: 'Promo code not valid for this ticket type' }, { status: 400 });
      }
    }

    // Validate minimum purchase quantity
    if (promo.min_purchase_qty && quantity < promo.min_purchase_qty) {
      return Response.json({
        error: `Minimum ${promo.min_purchase_qty} tickets required for this promo code`,
      }, { status: 400 });
    }

    // Validate usage limit
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
      return Response.json({ error: 'Promo code usage limit exceeded' }, { status: 400 });
    }

    // Validate date range
    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return Response.json({ error: 'Promo code is not yet active' }, { status: 400 });
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return Response.json({ error: 'Promo code has expired' }, { status: 400 });
    }

    return Response.json({
      valid: true,
      type: promo.discount_type,
      discount: promo.discount_value,
      discountLabel: promo.discount_type === 'percentage'
        ? `${promo.discount_value}% off`
        : `$${promo.discount_value} off`,
    });
  } catch (error) {
    console.error('Promo validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});