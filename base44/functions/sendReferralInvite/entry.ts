import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, message } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate referral code
    const referralCode = user.id.substring(0, 8).toUpperCase();
    const referralLink = `${Deno.env.get('BASE44_APP_URL') || 'http://localhost:5173'}?ref=${referralCode}`;

    // Send invite email via Base44
    await base44.integrations.Core.SendEmail({
      to: email,
      subject: `${user.full_name} invited you to Planet Baltimore`,
      body: `
Hi there,

${user.full_name} thinks you'd love Planet Baltimore, a platform connecting Baltimore's creative community.

${message ? `Personal message: ${message}\n\n` : ''}

Join using their referral link: ${referralLink}

You'll both get credit when you join!

Welcome to Planet Baltimore 🎨
      `,
      from_name: 'Planet Baltimore'
    });

    // Create pending referral record for email
    const referral = await base44.entities.Referral.create({
      referrer_id: user.id,
      referrer_name: user.full_name,
      referrer_avatar: user.avatar_url,
      referral_code: referralCode,
      referral_type: 'email',
      email_invited: email,
      status: 'pending'
    });

    return Response.json({ 
      success: true, 
      referral,
      referralLink 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});