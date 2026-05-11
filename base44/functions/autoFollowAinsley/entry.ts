import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const AINSLEY_USER_ID = '69ea6b08dd7ab098a7066585';
const AINSLEY_NAME = 'Ainsley Burrows';
const AINSLEY_AVATAR = 'https://base44.app/api/apps/69ea6b08dd7ab098a7066584/files/mp/public/69ea6b08dd7ab098a7066584/48f7a1c42_Screenshot2026-04-24231950.png';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all existing follows FROM Ainsley to users — these are already processed
    const ainsleyFollowing = await base44.asServiceRole.entities.Follow.filter({
      follower_id: AINSLEY_USER_ID,
      target_type: 'user',
    }, null, 500);

    const alreadyFollowedIds = new Set(ainsleyFollowing.map(f => f.target_id));
    alreadyFollowedIds.add(AINSLEY_USER_ID); // skip self

    // Get all users
    const allUsers = await base44.asServiceRole.entities.User.list(null, 500);

    let processed = 0;

    for (const user of allUsers) {
      const userId = user.id;
      if (alreadyFollowedIds.has(userId)) continue;

      const userName = user.full_name || user.email || 'New User';

      // 1. New user follows Ainsley (if not already)
      const existingFollow = await base44.asServiceRole.entities.Follow.filter({
        follower_id: userId,
        target_type: 'user',
        target_id: AINSLEY_USER_ID,
      });
      if (existingFollow.length === 0) {
        await base44.asServiceRole.entities.Follow.create({
          follower_id: userId,
          target_type: 'user',
          target_id: AINSLEY_USER_ID,
          target_name: AINSLEY_NAME,
        });
      }

      // 2. Ainsley follows the user back
      await base44.asServiceRole.entities.Follow.create({
        follower_id: AINSLEY_USER_ID,
        target_type: 'user',
        target_id: userId,
        target_name: userName,
      });

      // 3. Send welcome notification
      await base44.asServiceRole.entities.Notification.create({
        user_id: userId,
        type: 'follow',
        title: 'Welcome to Planet Baltimore!',
        body: `${AINSLEY_NAME} is now following you. Welcome to the community!`,
        actor_id: AINSLEY_USER_ID,
        actor_name: AINSLEY_NAME,
        actor_avatar: AINSLEY_AVATAR,
        link: `/profile/${AINSLEY_USER_ID}`,
        is_read: false,
      });

      processed++;
    }

    return Response.json({ success: true, processed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});