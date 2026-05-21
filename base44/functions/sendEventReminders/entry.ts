import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    // Window: events starting between 23h and 25h from now
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Fetch upcoming events in the 24h window
    const events = await base44.asServiceRole.entities.Event.filter({
      status: 'upcoming',
    });

    const targetEvents = events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate >= windowStart && eventDate <= windowEnd;
    });

    if (targetEvents.length === 0) {
      return Response.json({ status: 'ok', reminders_sent: 0, message: 'No events in reminder window' });
    }

    let remindersSent = 0;

    for (const event of targetEvents) {
      // Get all RSVPs for this event with status 'going' or 'interested'
      const rsvps = await base44.asServiceRole.entities.RSVP.filter({
        event_id: event.id,
      });

      const activeRsvps = rsvps.filter(r => r.status === 'going' || r.status === 'interested');

      for (const rsvp of activeRsvps) {
        // Check if we already sent a reminder for this event+user
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_id: rsvp.user_id,
          type: 'event_reminder',
          link: `/events/${event.id}`,
        });

        // Skip if reminder already sent
        if (existing.length > 0) continue;

        const eventDate = new Date(event.date);
        const formattedTime = eventDate.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        });

        await base44.asServiceRole.entities.Notification.create({
          user_id: rsvp.user_id,
          type: 'event_reminder',
          title: `Reminder: "${event.title}" is tomorrow`,
          body: `${event.venue_name ? `@ ${event.venue_name} · ` : ''}${formattedTime}`,
          link: `/events/${event.id}`,
          is_read: false,
        });

        remindersSent++;
      }
    }

    return Response.json({ status: 'ok', reminders_sent: remindersSent, events_checked: targetEvents.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});