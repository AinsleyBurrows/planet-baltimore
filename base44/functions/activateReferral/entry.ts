import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { referralCode } = await req.json();

    if (!referralCode) {
      return Response.json({ error: 'Referral code required' }, { status: 400 });
    }

    // Find the referral by code
    const referrals = await base44.entities.Referral.filter({ referral_code: referralCode });
    if (referrals.length === 0) {
      return Response.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referral = referrals[0];

    // Only activate if not already active
    if (referral.status === 'active') {
      return Response.json({ success: false, message: 'Already activated' });
    }

    // Calculate points based on tier
    const pointsByTier = { 1: 5, 2: 3, 3: 1 };
    const points = pointsByTier[referral.tier] || 0;

    // Update referral status
    await base44.entities.Referral.update(referral.id, {
      status: 'active',
      points_awarded: points,
      joined_at: new Date().toISOString()
    });

    // Award points to referrer's leaderboard score
    // First check if referrer has an entry in Post, Event, or other leaderboard entity
    // For now, we'll store it as a custom user attribute
    const referrerUser = await base44.asServiceRole.entities.User.get(referral.referrer_id);
    if (referrerUser) {
      const currentScore = referrerUser.referral_points || 0;
      await base44.asServiceRole.entities.User.update(referral.referrer_id, {
        referral_points: currentScore + points
      });
    }

    return Response.json({ 
      success: true, 
      referral: referral.referrer_name,
      pointsAwarded: points
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});