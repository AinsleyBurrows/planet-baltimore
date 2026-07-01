import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    // Window: events starting between 1h50m and 2h10m from now
    const windowStart = new Date(now.getTime() + 110 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 130 * 60 * 1000);

    const events = await base44.asServiceRole.entities.Event.filter({
      status: 'upcoming',
    });

    const targetEvents = events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate >= windowStart && eventDate <= windowEnd;
    });

    if (targetEvents.length === 0) {
      return Response.json({ status: 'ok', reminders_sent: 0, message: 'No events in 2-hour window' });
    }

    let remindersSent = 0;

    for (const event of targetEvents) {
      const rsvps = await base44.asServiceRole.entities.RSVP.filter({
        event_id: event.id,
      });

      const activeRsvps = rsvps.filter(r => r.status === 'going' || r.status === 'interested');

      for (const rsvp of activeRsvps) {
        if (!rsvp.user_id) continue;

        // Dedup: skip if a 2-hour reminder was already sent for this event+user
        const existing = await base44.asServiceRole.entities.Notification.filter({
          user_id: rsvp.user_id,
          type: 'event_reminder',
          title: `Starting Soon: "${event.title}"`,
          link: `/events/${event.id}`,
        });
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
          title: `Starting Soon: "${event.title}"`,
          body: `Your event starts in 2 hours${event.venue_name ? ` · ${event.venue_name}` : ''} · ${formattedTime}`,
          link: `/events/${event.id}`,
          is_read: false,
        });

        // Also email the attendee when an email is on the RSVP
        if (rsvp.attendee_email) {
          try {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: rsvp.attendee_email,
              subject: `Starting Soon: ${event.title}`,
              body: `Your event "${event.title}" starts in about 2 hours.\n\n` +
                    `${event.venue_name ? `Venue: ${event.venue_name}\n` : ''}` +
                    `When: ${formattedTime}\n\n` +
                    `See you there!\n\n` +
                    `View event: https://planetbaltimore.com/events/${event.id}`,
            });
          } catch (_e) { /* email failure shouldn't block the notification */ }
        }

        remindersSent++;
      }
    }

    return Response.json({ status: 'ok', reminders_sent: remindersSent, events_checked: targetEvents.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});