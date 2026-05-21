import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId, attendeeInfo } = await req.json();
    if (!eventId) return Response.json({ error: 'Missing eventId' }, { status: 400 });

    // Fetch event details
    const eventResults = await base44.asServiceRole.entities.Event.filter({ id: eventId });
    const event = eventResults[0];
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    // Idempotency: skip if RSVP e-ticket already issued for this user+event
    const existingTickets = await base44.asServiceRole.entities.Ticket.filter({
      event_id: eventId,
      owner_id: user.id,
      order_id: `rsvp_${eventId}_${user.id}`,
    });

    let ticket;
    if (existingTickets.length > 0) {
      ticket = existingTickets[0];
    } else {
      // Create a free RSVP ticket record (no TicketOrder needed)
      const uniqueCode = `RSVP-${eventId.slice(0, 6).toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      ticket = await base44.asServiceRole.entities.Ticket.create({
        order_id: `rsvp_${eventId}_${user.id}`,
        ticket_type_id: 'rsvp',
        event_id: eventId,
        owner_id: user.id,
        owner_email: attendeeInfo?.email || user.email,
        unique_code: uniqueCode,
        ticket_number: '1 of 1',
        is_checked_in: false,
      });
    }

    const recipientEmail = attendeeInfo?.email || user.email;
    const recipientName = attendeeInfo?.name || user.full_name || 'Guest';
    const origin = req.headers.get('origin') || 'https://planetbaltimore.base44.app';

    const eventDate = event.date
      ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '';

    const ticketDetails = [
      `Event: ${event.title}`,
      eventDate ? `Date: ${eventDate}` : '',
      event.venue_name ? `Venue: ${event.venue_name}` : '',
      event.address ? `Address: ${event.address}` : '',
      ``,
      `🎟️ Your RSVP Code: ${ticket.unique_code}`,
      ``,
      `Show this code at the door or view your ticket at:`,
      `${origin}/profile`,
    ].filter(Boolean).join('\n');

    // Send confirmation email
    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `You're going to ${event.title}! 🎉`,
      body: `Hi ${recipientName},\n\nYour RSVP is confirmed!\n\n${ticketDetails}\n\nSee you there!\nPlanet Baltimore`,
      from_name: 'Planet Baltimore Events',
    });

    // Send direct message on platform
    const conversationId = `system_${user.id}`;
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      sender_id: 'system',
      sender_name: 'Planet Baltimore',
      recipient_id: user.id,
      recipient_name: recipientName,
      content: `🎟️ RSVP Confirmed — ${event.title}\n\n${ticketDetails}\n\nA confirmation has also been sent to ${recipientEmail}.`,
      is_read: false,
    });

    return Response.json({ success: true, ticketCode: ticket.unique_code });
  } catch (error) {
    console.error('RSVP confirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});