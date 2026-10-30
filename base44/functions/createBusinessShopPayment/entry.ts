import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in to check out.' }, { status: 401 });

    const { businessId, items, shipping } = await req.json().catch(() => ({}));
    if (!businessId || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Your bag is empty.' }, { status: 400 });
    }
    const address = {
      name: String(shipping?.name || '').trim(),
      address1: String(shipping?.address1 || '').trim(),
      address2: String(shipping?.address2 || '').trim(),
      city: String(shipping?.city || '').trim(),
      state: String(shipping?.state || '').trim(),
      zip: String(shipping?.zip || '').trim(),
      phone: String(shipping?.phone || '').trim(),
    };
    if (!address.name || !address.address1 || !address.city || !address.state || !address.zip) {
      return Response.json({ error: 'Please complete your delivery address.' }, { status: 400 });
    }

    const businessResults = await base44.asServiceRole.entities.BusinessPage.filter({ id: businessId });
    const business = businessResults[0];
    if (!business) return Response.json({ error: 'Business not found' }, { status: 404 });

    // Quantities come from the client, prices never do.
    const wanted = new Map();
    for (const entry of items) {
      const id = entry?.id;
      if (!id) continue;
      const quantity = Math.max(1, Math.min(20, Number(entry?.quantity) || 1));
      wanted.set(id, (wanted.get(id) || 0) + quantity);
    }
    const ids = [...wanted.keys()];
    if (ids.length === 0) return Response.json({ error: 'Your bag is empty.' }, { status: 400 });

    const records = await base44.asServiceRole.entities.ShopItem.filter({ id: { $in: ids } });
    const lines = [];
    let subtotal = 0;
    for (const item of records) {
      if (item.business_id !== businessId) continue;
      if (item.status === 'sold_out') {
        return Response.json({ error: `${item.title} is sold out.` }, { status: 400 });
      }
      const price = Number(item.price) || 0;
      if (price <= 0) continue;
      const quantity = wanted.get(item.id) || 1;
      subtotal += price * quantity;
      lines.push({
        shop_item_id: item.id,
        title: item.title,
        image_url: item.image_url || '',
        price,
        quantity,
      });
    }
    if (lines.length === 0) {
      return Response.json({ error: 'These items are not available for purchase.' }, { status: 400 });
    }

    const total = Math.round(subtotal * 100) / 100;
    if (total < 0.5) {
      return Response.json({ error: 'This order is too small to process.' }, { status: 400 });
    }

    const orderNumber = `PB-${Date.now().toString(36).toUpperCase()}`;
    const order = await base44.asServiceRole.entities.ShopOrder.create({
      order_number: orderNumber,
      business_id: businessId,
      business_name: business.name,
      seller_email: business.email || '',
      buyer_id: user.id,
      buyer_name: address.name,
      buyer_email: user.email,
      items: lines,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping_cost: 0,
      total,
      shipping: address,
      payment_status: 'pending',
    });

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      description: `${business.name} order ${orderNumber}`,
      receipt_email: user.email,
      metadata: {
        type: 'business_shop',
        orderId: order.id,
        businessId,
        buyerId: user.id,
      },
    });

    await base44.asServiceRole.entities.ShopOrder.update(order.id, { payment_intent_id: intent.id });

    return Response.json({
      clientSecret: intent.client_secret,
      orderId: order.id,
      orderNumber,
      total,
    });
  } catch (error) {
    console.error('Business shop payment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}