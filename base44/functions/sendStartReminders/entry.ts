import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Scheduled reminder: notifies followers (Follow entity) ~1 hour before an
// event or festival begins. Runs every 5 minutes via a scheduled automation.
// Events use their real start datetime; festivals only carry a start_date
// (no time), so the festival start is treated as 00:00 UTC of that date.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    // 10-minute window centered on "1 hour from now". Dedupe per user+link
    // makes the wide window safe: each item triggers exactly once even if a
    // tick is missed and the next tick still falls inside the window.
    const windowStart = new Date(now.getTime() + 50 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 70 * 60 * 1000);

    let remindersSent = 0;
    let itemsChecked = 0;

    const fmtTime = (d) => d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/New_York',
    });

    // Build + send notifications for a batch of followers, deduped by an
    // exact link (with a #1h suffix so 1h reminders never collide with the
    // existing 24h event reminders that share type 'event_reminder').
    const notifyFollowers = async (followers, link, title, body) => {
      if (!followers.length) return;
      const already = await base44.asServiceRole.entities.Notification.filter({
        type: 'event_reminder',
        link,
      });
      const notified = new Set(already.map((n) => n.user_id));
      const toCreate = followers
        .filter((f) => !notified.has(f.follower_id))
        .map((f) => ({
          user_id: f.follower_id,
          type: 'event_reminder',
          title,
          body,
          link,
          is_read: false,
        }));
      if (toCreate.length) {
        await base44.asServiceRole.entities.Notification.bulkCreate(toCreate);
        remindersSent += toCreate.length;
      }
    };

    // ---- Events (start datetime available) ----
    const events = await base44.asServiceRole.entities.Event.filter({ status: 'upcoming' });
    for (const event of events) {
      if (!event.date) continue;
      const start = new Date(event.date);
      if (start < windowStart || start > windowEnd) continue;
      itemsChecked++;

      const link = `/events/${event.id}#1h`;
      const followers = await base44.asServiceRole.entities.Follow.filter({
        target_type: 'event',
        target_id: event.id,
      });
      if (!followers.length) continue;

      const when = fmtTime(start);
      await notifyFollowers(
        followers,
        link,
        `Starting soon: "${event.title}"`,
        `Begins in about 1 hour${event.venue_name ? ` @ ${event.venue_name}` : ''} · ${when}`,
      );
    }

    // ---- Festivals (start_date only; treat as 00:00 UTC of that date) ----
    const festivals = await base44.asServiceRole.entities.Festival.filter({ status: 'published' });
    for (const fest of festivals) {
      if (!fest.start_date) continue;
      const start = new Date(fest.start_date + 'T00:00:00Z');
      if (start < windowStart || start > windowEnd) continue;
      itemsChecked++;

      const link = `/festivals/${fest.slug || fest.id}#1h`;
      const followers = await base44.asServiceRole.entities.Follow.filter({
        target_type: 'festival',
        target_id: fest.id,
      });
      if (!followers.length) continue;

      const when = fmtTime(start);
      await notifyFollowers(
        followers,
        link,
        `Starting soon: ${fest.name}`,
        `Begins in about 1 hour${fest.venue ? ` @ ${fest.venue}` : ''} · ${when}`,
      );
    }

    return Response.json({ status: 'ok', reminders_sent: remindersSent, items_checked: itemsChecked });
  } catch (error) {
    console.error('Error sending start reminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});