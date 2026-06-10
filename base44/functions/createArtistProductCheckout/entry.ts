import Stripe from 'npm:stripe@14.0.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { productId, quantity = 1 } = await req.json();
    if (!productId) return Response.json({ error: 'productId required' }, { status: 400 });

    const products = await base44.asServiceRole.entities.ArtistProduct.filter({ id: productId });
    const product = products[0];
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 });
    if (!product.is_active) return Response.json({ error: 'Product is no longer available' }, { status: 400 });

    if (product.stock !== null && product.stock !== undefined && quantity > product.stock) {
      return Response.json({ error: `Only ${product.stock} in stock` }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://planetbaltimore.base44.app';

    const totalCents = Math.round(product.price * quantity * 100);
    if (totalCents === 0) {
      return Response.json({ error: 'Free products are not supported via checkout' }, { status: 400 });
    }

    const artists = await base44.asServiceRole.entities.ArtistPage.filter({ id: product.artist_page_id });
    const artist = artists[0];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.title,
            description: product.description || '',
            images: product.images?.length ? [product.images[0]] : [],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity,
      }],
      customer_email: user.email,
      success_url: `${origin}/artists/${product.artist_page_id}?shop_success=1`,
      cancel_url: `${origin}/artists/${product.artist_page_id}`,
      metadata: {
        productId: product.id,
        artistPageId: product.artist_page_id,
        buyerId: user.id,
        quantity: quantity.toString(),
        artistName: artist?.name || '',
      },
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Artist product checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});