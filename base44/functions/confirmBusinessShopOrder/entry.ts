import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Marks an order paid only after Stripe confirms the payment went through.
export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await req.json().catch(() => ({}));
    if (!orderId) return Response.json({ error: 'Missing orderId' }, { status: 400 });

    const results = await base44.asServiceRole.entities.ShopOrder.filter({ id: orderId });
    const order = results[0];
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });
    if (order.buyer_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (order.payment_status === 'paid') return Response.json({ paid: true, order });
    if (!order.payment_intent_id) return Response.json({ error: 'Order has no payment attached' }, { status: 400 });

    const stripe = new Stripe(secrets.get('STRIPE_SECRET_KEY'));
    const intent = await stripe.paymentIntents.retrieve(order.payment_intent_id);
    if (intent.status !== 'succeeded') {
      return Response.json({ paid: false, status: intent.status });
    }

    const updated = await base44.asServiceRole.entities.ShopOrder.update(order.id, {
      payment_status: 'paid',
    });
    return Response.json({ paid: true, order: updated });
  } catch (error) {
    console.error('Confirm shop order error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}