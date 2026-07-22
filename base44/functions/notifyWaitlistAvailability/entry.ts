import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Automated waitlist notification.
// Triggered by entity automations:
//   - TicketOrder updated to payment_status "refunded" (ticket cancelled/refunded)
//   - TicketType updated when availability opens (quantity_total increased or quantity_sold decreased)
// Payload (automation): { event, data, old_data }
// Payload (manual): { ticketTypeId } — notifies the first waitlisted person for that ticket type.
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const body = await req.json();

    let ticketTypeId = null;

    const isAutomation = !!(body.event && body.data);
    if (isAutomation) {
      const data = body.data || {};
      const old = body.old_data || {};

      // Case A: a TicketOrder was just refunded / cancelled
      if (data.ticket_type_id && data.payment_status === 'refunded') {
        // only act when the status actually transitioned to refunded
        if (old.payment_status !== 'refunded') {
          ticketTypeId = data.ticket_type_id;
        }
      }

      // Case B: a TicketType's availability opened up
      if (!ticketTypeId && (data.id && (data.quantity_total !== undefined || data.quantity_sold !== undefined))) {
        const oldAvail = Math.max(0, (old.quantity_total ?? 0) - (old.quantity_sold ?? 0));
        const newAvail = Math.max(0, (data.quantity_total ?? 0) - (data.quantity_sold ?? 0));
        if (oldAvail <= 0 && newAvail > 0) {
          ticketTypeId = data.id;
        }
      }
    } else {
      ticketTypeId = body.ticketTypeId || body.ticket_type_id;
    }

    if (!ticketTypeId) return Response.json({ skipped: true, reason: 'no availability change' });

    // Resolve the ticket type
    const ttResults = await base44.asServiceRole.entities.TicketType.filter({ id: ticketTypeId });
    const tt = ttResults[0];
    if (!tt) return Response.json({ skipped: true, reason: 'ticket type not found' });

    // Build the purchase link + event/festival title
    let title = 'your event';
    let link = '';
    if (tt.festival_id) {
      const fests = await base44.asServiceRole.entities.Festival.filter({ id: tt.festival_id });
      const fest = fests[0];
      if (fest) {
        title = fest.name;
        link = `/festivals/${fest.slug}`;
      }
    } else if (tt.event_id) {
      const evs = await base44.asServiceRole.entities.Event.filter({ id: tt.event_id });
      const ev = evs[0];
      if (ev) {
        title = ev.title;
        link = `/events/${tt.event_id}/tickets`;
      }
    } else if (body.data?.festival_id) {
      const fests = await base44.asServiceRole.entities.Festival.filter({ id: body.data.festival_id });
      const fest = fests[0];
      if (fest) { title = fest.name; link = `/festivals/${fest.slug}`; }
    } else if (body.data?.event_id) {
      title = 'your event';
      link = `/events/${body.data.event_id}/tickets`;
    }

    // Find the FIRST (oldest) un-notified waitlist entry for this ticket type
    const waitlist = await base44.asServiceRole.entities.Waitlist.filter(
      { ticket_type_id: ticketTypeId, notified: false },
      'created_date',
      1
    );

    if (!waitlist.length) return Response.json({ notified: 0 });

    const entry = waitlist[0];

    const appOrigin = 'https://app.base44.com';
    const fullLink = link ? `${appOrigin}${link}` : appOrigin;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: entry.user_email,
      subject: `🎟️ A ticket opened up: ${title}`,
      body: `Hi ${entry.user_name || 'there'},\n\nGreat news — a "${tt.name}" ticket for "${title}" just became available!\n\nIt's first-come, first-served, so grab yours before it's gone:\n${fullLink}\n\nSee you there!\n— Planet Baltimore`,
      from_name: 'Planet Baltimore',
    });

    await base44.asServiceRole.entities.Waitlist.update(entry.id, {
      notified: true,
      notified_at: new Date().toISOString(),
    });

    return Response.json({ success: true, notified: 1, to: entry.user_email });
  } catch (error) {
    console.error('notifyWaitlistAvailability error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});