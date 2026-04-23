import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RATE_LIMIT_HOURS = 24;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { association_id, subject, message, preview_only } = await req.json();

    if (!association_id || !message) {
      return Response.json({ error: 'association_id and message are required' }, { status: 400 });
    }

    // Fetch the association
    const associations = await base44.asServiceRole.entities.CommunityAssociation.filter({ id: association_id });
    const association = associations[0];

    if (!association) {
      return Response.json({ error: 'Association not found' }, { status: 404 });
    }

    // Permission check: must be owner, admin, or moderator
    const admins = association.admins || [];
    const moderators = association.moderators || [];
    const isAuthorized = association.owner_id === user.id || admins.includes(user.id) || moderators.includes(user.id);

    if (!isAuthorized) {
      return Response.json({ error: 'Forbidden: Only association admins can send mass messages' }, { status: 403 });
    }

    // Rate limit: max 1 mass message per 24 hours
    if (association.last_mass_message_at) {
      const lastSent = new Date(association.last_mass_message_at);
      const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSince < RATE_LIMIT_HOURS) {
        const hoursLeft = Math.ceil(RATE_LIMIT_HOURS - hoursSince);
        return Response.json({
          error: `Rate limit: You can send another mass message in ${hoursLeft} hour(s).`
        }, { status: 429 });
      }
    }

    // Fetch all active, non-muted members
    const members = await base44.asServiceRole.entities.AssociationMember.filter({
      association_id,
      muted: false
    });

    if (preview_only) {
      return Response.json({
        preview: true,
        recipient_count: members.length,
        message,
        subject: subject || `Message from ${association.name}`
      });
    }

    if (members.length === 0) {
      return Response.json({ delivered: 0, message: 'No members to message.' });
    }

    const finalSubject = subject || `Message from ${association.name}`;
    let delivered = 0;
    let emailsSent = 0;

    // Create in-app notifications for all members
    const notifPromises = members.map(async (member) => {
      if (member.notifications_enabled !== false) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: member.user_id,
          type: 'announcement',
          title: finalSubject,
          body: message,
          link: `/community-associations/${association_id}`,
          actor_name: association.name,
          actor_avatar: association.image_url,
          is_read: false
        });
        delivered++;
      }

      // Create inbox message
      const conversationId = [association_id, member.user_id].sort().join('_');
      await base44.asServiceRole.entities.Message.create({
        conversation_id: `assoc_${association_id}_${member.user_id}`,
        sender_id: user.id,
        sender_name: association.name,
        sender_avatar: association.image_url,
        recipient_id: member.user_id,
        recipient_name: member.user_name,
        content: `**${finalSubject}**\n\n${message}`,
        is_read: false
      });

      // Send email if member has email notifications enabled
      if (member.email_notifications !== false && member.user_email) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: member.user_email,
          subject: `[${association.name}] ${finalSubject}`,
          body: `<p>Hi ${member.user_name || 'Neighbor'},</p><p>${message}</p><p>— ${association.name} Leadership Team</p>`
        });
        emailsSent++;
      }
    });

    await Promise.allSettled(notifPromises);

    // Log mass message and update rate limit timestamp
    const logEntry = {
      sent_by: user.id,
      sent_by_name: user.full_name,
      subject: finalSubject,
      message,
      recipient_count: members.length,
      delivered,
      sent_at: new Date().toISOString()
    };

    const existingLog = association.mass_message_log || [];
    await base44.asServiceRole.entities.CommunityAssociation.update(association_id, {
      last_mass_message_at: new Date().toISOString(),
      mass_message_log: [...existingLog.slice(-49), logEntry] // keep last 50
    });

    return Response.json({
      success: true,
      delivered,
      emails_sent: emailsSent,
      total_members: members.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});