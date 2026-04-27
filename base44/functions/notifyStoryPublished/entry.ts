import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Triggered by entity automation when story status changes to published
    if (!body.event || body.event.type !== 'update') {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    const story = body.data;
    if (!story || story.status !== 'published') {
      return Response.json({ success: true });
    }

    // Get author
    const author = await base44.entities.User.get(story.author_id);
    if (!author) {
      return Response.json({ success: true });
    }

    // Find followers of the author
    const follows = await base44.asServiceRole.entities.Follow.filter({
      target_type: 'user',
      target_id: story.author_id,
    }, '-created_date', 100);

    if (follows.length === 0) {
      return Response.json({ success: true, message: 'No followers to notify' });
    }

    // Create notifications for each follower
    const notifications = follows.map(follow => ({
      user_id: follow.follower_id,
      type: 'announcement',
      title: `${author.full_name || 'Someone'} published a new story`,
      body: story.title,
      link: `/stories/${story.id}`,
      actor_id: story.author_id,
      actor_name: author.full_name,
      actor_avatar: author.avatar_url,
    }));

    await base44.asServiceRole.entities.Notification.bulkCreate(notifications);

    return Response.json({
      success: true,
      notificationsSent: notifications.length,
    });
  } catch (error) {
    console.error('Story publication notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});