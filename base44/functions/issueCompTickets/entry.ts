import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { event_id, ticket_type_id, recipients = [], notify = true } = body;
    if (!event_id || !ticket_type_id) return Response.json({ error: 'event_id and ticket_type_id are required' }, { status: 400 });
    if (!Array.isArray(recipients) || recipients.length === 0) return Response.json({ error: 'No recipients provided' }, { status: 400 });

    const event = await base44.asServiceRole.entities.Event.get(event_id);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });
    if (event.organizer_id !== user.id && user.role !== 'admin') return Response.json({ error: 'Only the organizer can issue comp tickets' }, { status: 403 });

    const resolved = [];
    const unresolved = [];
    for (const r of recipients) {
      let userId = r.user_id;
      let email = (r.email || '').trim().toLowerCase();
      let name = r.name || '';
      if (!userId && email) {
        try {
          const users = await base44.asServiceRole.entities.User.filter({ email });
          if (users && users.length > 0) {
            userId = users[0].id;
            email = (users[0].email || email).toLowerCase();
            name = name || users[0].full_name || users[0].display_name || '';
          } else { unresolved.push({ email: r.email || email, name }); continue; }
        } catch { unresolved.push({ email: r.email || email, name }); continue; }
      }
      if (!userId) { unresolved.push({ email: r.email || email, name }); continue; }
      resolved.push({ user_id: userId, email, name });
    }

    if (resolved.length === 0) {
      return Response.json({ issued: 0, unresolved, error: 'No recipients could be matched to Planet Baltimore accounts' });
    }

    const orderNo = `COMP-${Date.now().toString(36).toUpperCase()}`;
    const order = await base44.asServiceRole.entities.TicketOrder.create({
      event_id, ticket_type_id,
      buyer_id: user.id, buyer_email: user.email, buyer_name: user.full_name || 'Organizer',
      quantity: resolved.length, subtotal: 0, taxes: 0, platform_fee: 0, discount_applied: 0, total_amount: 0,
      payment_status: 'completed', order_number: orderNo,
    });

    const ts = Date.now().toString(36).toUpperCase();
    const tickets = resolved.map((a, i) => ({
      order_id: order.id, ticket_type_id, event_id,
      owner_id: a.user_id, owner_email: a.email || '',
      unique_code: `COMP-${ts}-${i + 1}`,
      ticket_number: `Comp #${i + 1}`,
    }));
    await base44.asServiceRole.entities.Ticket.bulkCreate(tickets);
    try { await base44.asServiceRole.entities.TicketType.updateMany({ id: ticket_type_id }, { $inc: { quantity_sold: resolved.length } }); } catch (_e) {}

    let emailed = 0;
    if (notify) {
      const subject = `You've been comped to ${event.title || 'our event'}`;
      const bodyTxt = `Good news — you've received a complimentary ticket to ${event.title || 'our event'}.\n\nYour ticket is now in your My Tickets tab on Planet Baltimore. We'll see you there!\n\n— ${user.full_name || 'Planet Baltimore'}`;
      for (const a of resolved) {
        if (a.email) { try { await base44.asServiceRole.integrations.Core.SendEmail({ to: a.email, subject, body: bodyTxt }); emailed++; } catch (_e) {} }
      }
    }

    return Response.json({ issued: resolved.length, unresolved, order_id: order.id, emailed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});