import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@14.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { eventId, organizerId, amount, stripeConnectAccountId } = body;

    if (!eventId || !amount || amount <= 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is the organizer or admin
    if (user.id !== organizerId && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let stripePayoutId = null;
    let payoutStatus = 'completed';

    // If a Stripe Connect account is provided, create a transfer
    if (stripeConnectAccountId && stripeConnectAccountId.startsWith('acct_')) {
      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: 'usd',
        destination: stripeConnectAccountId,
        description: `Payout for event ${eventId}`,
        metadata: { eventId, organizerId },
      });
      stripePayoutId = transfer.id;
      payoutStatus = 'in_transit';
    } else if (stripeConnectAccountId) {
      // If account ID provided but doesn't start with acct_, treat as manual
      payoutStatus = 'completed';
    }

    // Create payout record
    const payoutRecord = await base44.asServiceRole.entities.Payout.create({
      event_id: eventId,
      organizer_id: organizerId || user.id,
      total_gross_sales: amount,
      net_payout: amount,
      stripe_account_id: stripeConnectAccountId || '',
      stripe_payout_id: stripePayoutId || '',
      payout_status: payoutStatus,
      payout_date: new Date().toISOString(),
    });

    // Send confirmation email
    const orgUser = await base44.asServiceRole.entities.User.filter({ id: organizerId || user.id });
    if (orgUser[0]) {
      await base44.integrations.Core.SendEmail({
        to: orgUser[0].email,
        subject: 'Your payout has been initiated',
        body: `Hi ${orgUser[0].full_name},\n\nYour payout of $${amount.toFixed(2)} has been initiated${stripePayoutId ? ` (Transfer ID: ${stripePayoutId})` : ''}.\n\nExpected to arrive within 2-5 business days.\n\nBest,\nPlanet Baltimore`,
        from_name: 'Planet Baltimore',
      });
    }

    return Response.json({ success: true, payout: payoutRecord });
  } catch (error) {
    console.error('Payout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});