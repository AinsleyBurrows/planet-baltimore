import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const RATE_LIMIT_HOURS = 1;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agency_id, subject, message, preview_only } = await req.json();

    if (!agency_id || !message) {
      return Response.json({ error: 'agency_id and message are required' }, { status: 400 });
    }

    // Fetch the agency
    const agencies = await base44.asServiceRole.entities.GovernmentAgency.filter({ id: agency_id });
    const agency = agencies[0];

    if (!agency) {
      return Response.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Permission check: must be owner or platform admin
    const isAuthorized = agency.owner_id === user.id || user.role === 'admin';

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden: Only the agency owner can send messages to followers' }, { status: 403 });
    }

    // Rate limit: max 1 mass message per hour
    if (agency.last_mass_message_at) {
      const lastSent = new Date(agency.last_mass_message_at);
      const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSince < RATE_LIMIT_HOURS) {
        const hoursLeft = Math.ceil(RATE_LIMIT_HOURS - hoursSince);
        return Response.json({
          error: `Rate limit: You can send another message in ${hoursLeft} hour(s).`
        }, { status: 429 });
      }
    }

    // Fetch all followers of this government agency
    const followers = await base44.asServiceRole.entities.Follow.filter({
      target_type: 'government',
      target_id: agency_id
    });

    if (preview_only) {
      return Response.json({
        preview: true,
        recipient_count: followers.length,
        message,
        subject: subject || `Message from ${agency.name}`
      });
    }

    if (followers.length === 0) {
      return Response.json({ delivered: 0, message: 'No followers to message.' });
    }

    const finalSubject = subject || `Message from ${agency.name}`;
    let delivered = 0;
    let emailsSent = 0;

    // Fetch follower user records to get emails
    const followerUserIds = followers.map(f => f.follower_id);
    const users: any[] = [];
    // Fetch users in batches
    for (const fid of followerUserIds) {
      try {
        const u = await base44.asServiceRole.entities.User.get(fid);
        users.push(u);
      } catch {
        // skip users that can't be fetched
      }
    }
    const userMap = new Map(users.map(u => [u.id, u]));

    // Create in-app notifications + inbox messages for all followers
    const promises = followers.map(async (follower) => {
      const followerUser = userMap.get(follower.follower_id);

      // Create notification
      await base44.asServiceRole.entities.Notification.create({
        user_id: follower.follower_id,
        type: 'announcement',
        title: finalSubject,
        body: message,
        link: `/government-agencies/${agency_id}`,
        actor_id: user.id,
        actor_name: agency.name,
        actor_avatar: agency.image_url,
        is_read: false
      });
      delivered++;

      // Create inbox message
      if (followerUser) {
        await base44.asServiceRole.entities.Message.create({
          conversation_id: `gov_${agency_id}_${follower.follower_id}`,
          sender_id: user.id,
          sender_name: agency.name,
          sender_avatar: agency.image_url,
          recipient_id: follower.follower_id,
          recipient_name: followerUser.full_name || followerUser.email,
          content: `**${finalSubject}**\n\n${message}`,
          is_read: false
        });

        // Send email notification
        if (followerUser.email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: followerUser.email,
              subject: `[${agency.name}] ${finalSubject}`,
              body: `<p>Hi ${followerUser.full_name || 'Resident'},</p><p>${message}</p><p>— ${agency.name}</p>`
            });
            emailsSent++;
          } catch {
            // email send failure shouldn't block the whole operation
          }
        }
      }
    });

    await Promise.allSettled(promises);

    // Update rate limit timestamp
    await base44.asServiceRole.entities.GovernmentAgency.update(agency_id, {
      last_mass_message_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      delivered,
      emails_sent: emailsSent,
      total_followers: followers.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}