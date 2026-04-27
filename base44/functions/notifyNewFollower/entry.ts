import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    if (!body.event || body.event.type !== 'create') {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    const follow = body.data;
    if (!follow || follow.target_type !== 'user') {
      return Response.json({ success: true });
    }

    // Get follower and target user
    const [follower, targetUser] = await Promise.all([
      base44.entities.User.get(follow.follower_id),
      base44.entities.User.get(follow.target_id),
    ]);

    if (!follower || !targetUser) {
      return Response.json({ success: true });
    }

    // Send email to target user
    await base44.integrations.Core.SendEmail({
      to: targetUser.email,
      subject: `${follower.full_name || 'Someone'} started following you on Planet Baltimore`,
      body: `Hi ${targetUser.full_name},\n\n${follower.full_name} just followed you on Planet Baltimore!\n\nCheck out their profile: ${process.env.APP_URL}/profile/${follower.id}\n\nBest,\nPlanet Baltimore`,
      from_name: 'Planet Baltimore',
    });

    // Create notification
    await base44.asServiceRole.entities.Notification.create({
      user_id: follow.target_id,
      type: 'follow',
      title: `${follower.full_name || 'Someone'} followed you`,
      body: follower.bio || 'Check out their profile',
      link: `/profile/${follower.id}`,
      actor_id: follower.id,
      actor_name: follower.full_name,
      actor_avatar: follower.avatar_url,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Follow notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});