import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const u = new URL(req.url);
    const c = u.searchParams.get('c') || '';
    const h = u.searchParams.get('h') || '';
    let dest = u.searchParams.get('u') || '';
    if (c && h) {
      const camp = await base44.asServiceRole.entities.EmailCampaign.get(c).catch(() => null);
      await Promise.allSettled([
        base44.asServiceRole.entities.EmailCampaign.updateMany(
          { id: c },
          { $inc: { clicks_count: 1 }, $addToSet: { click_hashes: h } }
        ),
        base44.asServiceRole.entities.EmailEvent.create({
          campaign_id: c,
          event_id: camp?.event_id || '',
          owner_id: camp?.owner_id || '',
          event_type: 'click',
          recipient_hash: h
        })
      ]);
    }
    if (!/^https?:\/\//i.test(dest)) dest = '';
    if (!dest) return new Response('Invalid link', { status: 400 });
    return new Response(null, {
      status: 302,
      headers: { Location: dest, 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (_e) {
    return new Response('Something went wrong', { status: 500 });
  }
});