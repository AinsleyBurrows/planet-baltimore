import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { uniqueCode, eventId } = await req.json();

    if (!uniqueCode || !eventId) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify user is event organizer
    const eventResults = await base44.entities.Event.filter({ id: eventId });
    const event = eventResults[0];
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organizer_id !== user.id) {
      return Response.json({ error: 'Unauthorized - you are not the organizer' }, { status: 403 });
    }

    // Find ticket by unique code
    const tickets = await base44.entities.Ticket.filter(
      { unique_code: uniqueCode, event_id: eventId },
      '-created_date',
      1
    );

    if (tickets.length === 0) {
      return Response.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = tickets[0];

    // Check if already checked in
    if (ticket.is_checked_in) {
      return Response.json({
        error: 'Ticket already checked in',
        checkedInAt: ticket.checked_in_at,
        checkedInBy: ticket.checked_in_by,
      }, { status: 400 });
    }

    // Update ticket to checked in
    await base44.entities.Ticket.update(ticket.id, {
      is_checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: user.id,
    });

    // Get attendee details from order
    const orders = await base44.entities.TicketOrder.filter(
      { id: ticket.order_id },
      '-created_date',
      1
    );

    const order = orders[0];

    return Response.json({
      success: true,
      ticket: {
        ticketNumber: ticket.ticket_number,
        uniqueCode: ticket.unique_code,
      },
      attendee: {
        name: order?.buyer_name || 'Unknown',
        email: order?.buyer_email || '',
      },
      checkedInAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});