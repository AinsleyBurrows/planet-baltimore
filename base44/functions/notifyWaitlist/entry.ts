import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Called manually by organizer OR automatically when a ticket type gets new availability.
// Payload: { eventId, ticketTypeId }
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId, ticketTypeId } = await req.json();
    if (!eventId || !ticketTypeId) return Response.json({ error: 'Missing eventId or ticketTypeId' }, { status: 400 });

    // Verify organizer
    const events = await base44.asServiceRole.entities.Event.filter({ id: eventId });
    const event = events[0];
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (event.organizer_id !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ticketTypes = await base44.asServiceRole.entities.TicketType.filter({ id: ticketTypeId });
    const tt = ticketTypes[0];
    if (!tt) return Response.json({ error: 'Ticket type not found' }, { status: 404 });

    // Get un-notified waitlist entries for this ticket type
    const waitlist = await base44.asServiceRole.entities.Waitlist.filter({
      event_id: eventId,
      ticket_type_id: ticketTypeId,
      notified: false,
    });

    if (waitlist.length === 0) return Response.json({ notified: 0 });

    let notified = 0;
    for (const entry of waitlist) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: entry.user_email,
          subject: `🎟️ Tickets available: ${event.title}`,
          body: `Hi ${entry.user_name || 'there'},\n\nGreat news! "${tt.name}" tickets for "${event.title}" are now available again.\n\nGrab yours before they sell out:\n${window?.location?.origin || 'https://your-app.com'}/events/${eventId}/tickets\n\nSee you there!`,
        });
        await base44.asServiceRole.entities.Waitlist.update(entry.id, {
          notified: true,
          notified_at: new Date().toISOString(),
        });
        notified++;
      } catch (e) {
        console.error('Failed to notify', entry.user_email, e.message);
      }
    }

    return Response.json({ success: true, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});