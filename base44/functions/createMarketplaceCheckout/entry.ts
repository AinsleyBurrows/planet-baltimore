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

    const { listingId } = await req.json();
    if (!listingId) return Response.json({ error: 'Missing listingId' }, { status: 400 });

    const results = await base44.asServiceRole.entities.MarketplaceListing.filter({ id: listingId });
    const listing = results[0];
    if (!listing || !listing.is_active) {
      return Response.json({ error: 'Listing not found or inactive' }, { status: 404 });
    }

    if (listing.seller_id === user.id) {
      return Response.json({ error: 'You cannot purchase your own listing' }, { status: 400 });
    }

    // Check if already purchased
    const existing = await base44.asServiceRole.entities.MarketplaceOrder.filter({
      listing_id: listingId,
      buyer_id: user.id,
      payment_status: 'completed',
    });
    if (existing.length > 0) {
      return Response.json({ error: 'Already purchased', orderId: existing[0].id }, { status: 409 });
    }

    const platformFeeRate = 0.10; // 10% platform fee
    const amountCents = Math.round(listing.price * 100);
    const platformFeeCents = Math.round(amountCents * platformFeeRate);

    // Free listing — grant access directly
    if (amountCents === 0 || listing.is_free) {
      const orderNumber = `MKT-FREE-${Date.now()}`;
      const order = await base44.asServiceRole.entities.MarketplaceOrder.create({
        listing_id: listingId,
        listing_title: listing.title,
        seller_id: listing.seller_id,
        seller_name: listing.seller_name,
        buyer_id: user.id,
        buyer_email: user.email,
        buyer_name: user.full_name,
        amount: 0,
        platform_fee: 0,
        seller_payout: 0,
        payment_status: 'completed',
        payment_intent_id: `free_${Date.now()}`,
        order_number: orderNumber,
        download_url: listing.file_url || '',
      });
      return Response.json({ success: true, free: true, orderId: order.id, downloadUrl: listing.file_url });
    }

    const origin = req.headers.get('origin') || 'https://planetbaltimore.base44.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              description: listing.description || '',
              images: listing.cover_image ? [listing.cover_image] : [],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email,
      success_url: `${origin}/marketplace/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/marketplace`,
      metadata: {
        type: 'marketplace',
        listingId,
        buyerId: user.id,
        sellerId: listing.seller_id,
      },
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Marketplace checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});