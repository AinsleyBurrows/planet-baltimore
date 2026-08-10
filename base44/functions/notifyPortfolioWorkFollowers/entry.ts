import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const work = payload.data;
    if (!work || !work.artist_id) {
      return Response.json({ error: 'No portfolio work data' }, { status: 400 });
    }

    // Resolve the artist page for a friendly name
    let artistName = 'The artist';
    try {
      const artistPage = await base44.asServiceRole.entities.ArtistPage.get(work.artist_id);
      if (artistPage?.name) artistName = artistPage.name;
    } catch (e) {}

    // Fetch everyone following this artist
    const followers = await base44.asServiceRole.entities.Follow.filter(
      { target_type: 'artist', target_id: work.artist_id },
      undefined,
      1000
    );

    if (followers.length === 0) {
      return Response.json({ ok: true, notified: 0 });
    }

    const pieceLine = work.title ? `“${work.title}”` : 'a new piece';
    const meta = [work.year, work.medium, work.dimensions].filter(Boolean).join(' · ');
    const subject = `${artistName} just added a new work${work.title ? `: ${work.title}` : ''}`;
    const body = `Hi,

${artistName} just added ${pieceLine} to their portfolio on Planet Baltimore${meta ? `\n${meta}` : ''}.

Head to ${artistName}'s profile on Planet Baltimore to see it.

— Planet Baltimore`.trim();

    let sent = 0;
    for (const follow of followers) {
      try {
        const u = await base44.asServiceRole.entities.User.get(follow.follower_id);
        if (!u?.email) continue;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: u.email,
          subject,
          body,
          from_name: artistName,
        });
        sent++;
      } catch (e) {}
    }

    return Response.json({ ok: true, notified: sent, followers: followers.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}