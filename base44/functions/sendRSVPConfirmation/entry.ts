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

    // Build Google Calendar link
    function toGCalDate(d) { return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
    const gcalStart = event.date ? toGCalDate(event.date) : '';
    const gcalEnd = event.end_date ? toGCalDate(event.end_date) : (event.date ? toGCalDate(new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000)) : '');
    const gcalParams = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title || 'Event',
      dates: `${gcalStart}/${gcalEnd}`,
      details: `${event.description || ''}\n\n🎟️ RSVP Code: ${ticket.unique_code}\nView ticket: ${origin}/profile`,
      location: [event.venue_name, event.address].filter(Boolean).join(', '),
    });
    const gcalUrl = `https://calendar.google.com/calendar/render?${gcalParams.toString()}`;

    // Build ICS (Apple/Outlook) data URL
    const icsLines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Planet Baltimore//EN',
      'BEGIN:VEVENT',
      `DTSTART:${gcalStart}`,
      `DTEND:${gcalEnd}`,
      `SUMMARY:${(event.title || '').replace(/,/g, '\\,')}`,
      `DESCRIPTION:RSVP Code: ${ticket.unique_code}`,
      `LOCATION:${[event.venue_name, event.address].filter(Boolean).join(', ').replace(/,/g, '\\,')}`,
      'END:VEVENT', 'END:VCALENDAR',
    ];
    const icsDataUrl = `data:text/calendar;charset=utf8,${encodeURIComponent(icsLines.join('\r\n'))}`;

    const locationLine = [event.venue_name, event.address].filter(Boolean).join(' · ');

    // HTML email body
    const emailHtml = `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;color:#222;">
  <div style="background:#d4580a;padding:24px 28px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:22px;">You're going! 🎉</h1>
    <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Your RSVP for <strong>${event.title}</strong> is confirmed.</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:24px 28px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 16px;font-size:15px;">Hi ${recipientName},</p>

    <div style="background:#f9fafb;border-radius:10px;padding:16px;margin-bottom:20px;">
      ${eventDate ? `<p style="margin:0 0 8px;font-size:14px;">📅 <strong>${eventDate}</strong></p>` : ''}
      ${locationLine ? `<p style="margin:0 0 8px;font-size:14px;">📍 ${locationLine}</p>` : ''}
      <p style="margin:0;font-size:14px;">🎟️ RSVP Code: <strong style="font-family:monospace;font-size:16px;letter-spacing:1px;">${ticket.unique_code}</strong></p>
    </div>

    <p style="margin:0 0 12px;font-size:14px;color:#555;">Add this event to your calendar:</p>
    <div style="display:flex;gap:10px;margin-bottom:24px;">
      <a href="${gcalUrl}" target="_blank" style="background:#4285F4;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;">📅 Google Calendar</a>
      <a href="${icsDataUrl}" download="event.ics" style="background:#555;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;">🍎 Apple / Outlook</a>
    </div>

    <a href="${origin}/profile" style="display:block;text-align:center;background:#d4580a;color:#fff;text-decoration:none;padding:12px;border-radius:8px;font-size:14px;font-weight:600;margin-bottom:20px;">View My Ticket</a>

    <p style="margin:0;font-size:13px;color:#888;">See you there! — <strong>Planet Baltimore</strong></p>
  </div>
</div>`;

    // Send confirmation email
    await base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `You're going to ${event.title}! 🎉`,
      body: emailHtml,
      from_name: 'Planet Baltimore Events',
    });

    // Send direct message on platform
    const dmText = [
      `🎟️ RSVP Confirmed — ${event.title}`,
      eventDate ? `📅 ${eventDate}` : '',
      locationLine ? `📍 ${locationLine}` : '',
      ``,
      `Your RSVP Code: ${ticket.unique_code}`,
      ``,
      `Add to Google Calendar: ${gcalUrl}`,
      ``,
      `View your ticket: ${origin}/profile`,
      ``,
      `A confirmation email has also been sent to ${recipientEmail}.`,
    ].filter(s => s !== undefined).join('\n');

    const conversationId = `system_${user.id}`;
    await base44.asServiceRole.entities.Message.create({
      conversation_id: conversationId,
      sender_id: 'system',
      sender_name: 'Planet Baltimore',
      recipient_id: user.id,
      recipient_name: recipientName,
      content: dmText,
      is_read: false,
    });

    return Response.json({ success: true, ticketCode: ticket.unique_code });
  } catch (error) {
    console.error('RSVP confirmation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});