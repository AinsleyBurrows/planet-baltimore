import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const guestRequest = payload.data;
    if (!guestRequest) {
      return Response.json({ error: 'No data provided' }, { status: 400 });
    }

    // Fetch the artist page to get the owner
    const artistPage = await base44.asServiceRole.entities.ArtistPage.get(guestRequest.artist_page_id);
    if (!artistPage) {
      return Response.json({ error: 'Artist page not found' }, { status: 404 });
    }

    // Fetch the owner's user record to get their email
    const owner = await base44.asServiceRole.entities.User.get(artistPage.owner_id);
    if (!owner?.email) {
      return Response.json({ error: 'Owner email not found' }, { status: 404 });
    }

    const typeLabel = guestRequest.type === 'local_artist' ? 'Local Artist'
      : guestRequest.type === 'business_owner' ? 'Business Owner'
      : 'Guest';

    const emailBody = `
Hi ${artistPage.name},

You have a new guest request for your podcast!

Name: ${guestRequest.name}
Type: ${typeLabel}
Email: ${guestRequest.email}
${guestRequest.social_or_website ? `Website/Social: ${guestRequest.social_or_website}` : ''}

Their Pitch:
${guestRequest.pitch}

You can review and respond to this request from your Guests tab on Planet Baltimore.

— Planet Baltimore
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: owner.email,
      subject: `New Guest Request for ${artistPage.name} — ${guestRequest.name}`,
      body: emailBody,
      from_name: 'Planet Baltimore',
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});