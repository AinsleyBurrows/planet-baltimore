import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'Story') {
      return Response.json({ ok: true });
    }

    const story = data;

    if (story.status !== 'published' || story.visibility !== 'public') {
      return Response.json({ ok: true });
    }

    // Get all followers of this author
    const followers = await base44.asServiceRole.entities.Follow.filter({
      target_type: 'user',
      target_id: story.author_id,
    });

    if (followers.length === 0) {
      return Response.json({ ok: true, notified: 0 });
    }

    // Create notifications for each follower
    const notifications = followers.map(follow => ({
      user_id: follow.follower_id,
      type: 'mention',
      title: `${story.author_name} published a new story`,
      body: story.subtitle || story.title,
      link: `/stories/${story.id}`,
      actor_id: story.author_id,
      actor_name: story.author_name,
      actor_avatar: story.author_avatar,
    }));

    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);

    return Response.json({ ok: true, notified: followers.length });
  } catch (error) {
    console.error('Error notifying story followers:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});