import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const review = payload.data;
    if (!review || !review.artist_owner_id || !review.artist_id) {
      return Response.json({ error: 'No review data' }, { status: 400 });
    }

    const ownerId = review.artist_owner_id;
    const reviewerName = review.reviewer_name || 'A collector';
    const ratingLabel = review.rating ? `${review.rating}★` : '';
    const titleLabel = review.title ? ` “${review.title}”` : '';

    // Resolve the artist page name for a friendlier message
    let artistName = null;
    try {
      const artistPage = await base44.asServiceRole.entities.ArtistPage.get(review.artist_id);
      artistName = artistPage?.name || null;
    } catch (e) {}

    // 1. In-app notification to the artist owner
    try {
      await base44.asServiceRole.entities.Notification.create({
        user_id: ownerId,
        type: 'review',
        title: 'New collector review awaiting approval',
        body: `${reviewerName} left a ${ratingLabel} review${titleLabel} on your profile awaiting approval.`,
        link: `/artists/${review.artist_id}`,
        actor_name: reviewerName,
      });
    } catch (e) {}

    // 2. Email the owner (only reaches registered app users)
    let ownerEmail = null;
    try {
      const owner = await base44.asServiceRole.entities.User.get(ownerId);
      ownerEmail = owner?.email;
    } catch (e) {}

    if (ownerEmail) {
      const emailBody = `Hi ${artistName || 'there'},

${reviewerName} just submitted a new collector review${ratingLabel ? ` (${ratingLabel})` : ''}${titleLabel} on your Planet Baltimore artist profile.

"${review.comment || ''}"

You can review and approve it from the Collector Reviews tab on your profile.

— Planet Baltimore`.trim();
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: ownerEmail,
          subject: `New collector review awaiting approval — ${reviewerName}`,
          body: emailBody,
          from_name: 'Planet Baltimore',
        });
      } catch (e) {}
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}