import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { festivalId, festivalName, festivalSlug, organizerName, update } = await req.json();
    if (!festivalId || !update?.message) {
      return Response.json({ error: 'Missing festivalId or update message' }, { status: 400 });
    }

    // Verify the caller owns (or admins) the festival before broadcasting.
    const records = await base44.entities.Festival.filter({ id: festivalId });
    const festival = records[0];
    if (!festival) return Response.json({ error: 'Festival not found' }, { status: 404 });
    if (festival.owner_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch every server-side follower of this festival.
    const followers = await base44.asServiceRole.entities.Follow.filter({
      target_type: 'festival',
      target_id: festivalId,
    });

    if (followers.length === 0) {
      return Response.json({ ok: true, notified: 0 });
    }

    const label = update.type || 'Update';
    const notifications = followers.map((follow) => ({
      user_id: follow.follower_id,
      type: 'announcement',
      title: `${festivalName || festival.name}: ${label}`,
      body: update.message,
      link: `/festivals/${festivalSlug || festival.slug}`,
      actor_id: user.id,
      actor_name: organizerName || user.full_name || festival.name,
    }));

    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);

    return Response.json({ ok: true, notified: followers.length });
  } catch (error) {
    console.error('Error notifying festival followers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});