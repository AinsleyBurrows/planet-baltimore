import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

// 10% platform fee on shop item purchases
const PLATFORM_FEE_RATE = 0.10;

export default async function(req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { shopItemId } = await req.json();
    if (!shopItemId) return Response.json({ error: 'Missing shopItemId' }, { status: 400 });

    const itemResults = await base44.asServiceRole.entities.ShopItem.filter({ id: shopItemId });
    const item = itemResults[0];
    if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });
    if (item.status === 'sold_out') return Response.json({ error: 'This item is sold out' }, { status: 400 });

    const price = Number(item.price) || 0;
    if (price <= 0) return Response.json({ error: 'This item is not available for purchase' }, { status: 400 });

    // Resolve the artist's Stripe Connect account
    let artist = null;
    if (item.artist_id) {
      const artistResults = await base44.asServiceRole.entities.ArtistPage.filter({ id: item.artist_id });
      artist = artistResults[0];
    }
    const stripeConnectId = artist?.stripe_connect_id;
    if (!stripeConnectId) {
      return Response.json({
        error: 'This artist has not connected their Stripe account. Purchases are unavailable until they set up payment in their profile.',
        code: 'STRIPE_NOT_CONFIGURED'
      }, { status: 400 });
    }

    const amountCents = Math.round(price * 100);
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);
    const origin = req.headers.get('origin') || 'https://planetbaltimore.base44.app';
    const cancelPath = item.artist_id ? `/artists/${item.artist_id}` : '/';

    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: item.title,
              description: item.description || item.medium || '',
              images: item.image_url ? [item.image_url] : [],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata: {
        type: 'shop_item',
        shopItemId: item.id,
        artistId: item.artist_id || '',
        buyerId: user.id,
      },
    };

    // Route artist's portion to their Stripe Connect account
    sessionParams.payment_intent_data = {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: stripeConnectId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Shop item checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}