import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe@15.0.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { eventId, amount, stripeConnectAccountId } = body;

    if (!eventId || !amount || !stripeConnectAccountId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create payout in Stripe Connect account
    const payout = await stripe.payouts.create(
      {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        statement_descriptor: `Planet Baltimore - Event ${eventId}`,
      },
      { stripeAccount: stripeConnectAccountId }
    );

    // Store payout record
    const payoutRecord = await base44.asServiceRole.entities.Payout.create({
      event_id: eventId,
      organizer_id: body.organizerId,
      stripe_payout_id: payout.id,
      amount: amount,
      status: payout.status,
      arrival_date: payout.arrival_date ? new Date(payout.arrival_date * 1000).toISOString() : null,
    });

    // Send email to organizer
    const organizer = await base44.entities.User.get(body.organizerId);
    if (organizer) {
      await base44.integrations.Core.SendEmail({
        to: organizer.email,
        subject: `Payout processed for your event (${payout.id})`,
        body: `Hi ${organizer.full_name},\n\nWe've initiated a payout of $${amount.toFixed(2)} for your event.\n\nStatus: ${payout.status}\nExpected arrival: ${payout.arrival_date ? new Date(payout.arrival_date * 1000).toLocaleDateString() : 'Soon'}\n\nBest,\nPlanet Baltimore`,
        from_name: 'Planet Baltimore',
      });
    }

    return Response.json({ success: true, payout: payoutRecord });
  } catch (error) {
    console.error('Payout processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});