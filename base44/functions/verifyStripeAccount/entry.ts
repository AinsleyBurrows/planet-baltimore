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

    const { connectId, artistPageId } = await req.json();

    if (!connectId) {
      return Response.json({ valid: false, error: 'Stripe Secret Key is required' });
    }

    if (!connectId.startsWith('sk_')) {
      return Response.json({ 
        valid: false, 
        error: 'Invalid format. Your Stripe Secret Key should start with "sk_". Find it at stripe.com → Developers → API keys.' 
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    let verified = false;
    let accountInfo = null;

    try {
      const testStripe = new Stripe(connectId);
      const account = await testStripe.account.retrieve();
      verified = true;
      accountInfo = {
        name: account.business_profile?.name || account.email || 'Stripe Account',
        type: account.type,
      };
    } catch (stripeError) {
      verified = false;
    }

    // Save to ArtistPage if provided
    if (artistPageId) {
      // Verify ownership
      const pages = await base44.asServiceRole.entities.ArtistPage.filter({ id: artistPageId, owner_id: user.id });
      if (pages.length > 0) {
        await base44.asServiceRole.entities.ArtistPage.update(artistPageId, {
          stripe_connect_id: connectId,
          stripe_key_verified: verified,
        });
      }
    }

    if (verified) {
      return Response.json({ 
        valid: true, 
        verified: true,
        message: `Connected: ${accountInfo.name}` 
      });
    } else {
      return Response.json({ 
        valid: true, 
        verified: false,
        message: 'Account ID saved. Note: fully automatic transfers require connecting your Stripe account to Planet Baltimore. Payouts can be processed manually from the Organizer Studio.'
      });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});