import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const { campaign_id, app_url } = payload;
    if (!campaign_id) return Response.json({ error: 'campaign_id required' }, { status: 400 });

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL');
    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      try { await base44.entities.EmailCampaign.update(campaign_id, { status: 'not_configured', error: 'Add RESEND_API_KEY and RESEND_FROM_EMAIL secrets to enable sending.' }); } catch {}
      return Response.json({ status: 'not_configured', error: 'Resend not configured' });
    }

    const campaign = await base44.entities.EmailCampaign.get(campaign_id);
    if (!campaign) return Response.json({ error: 'Campaign not found' }, { status: 404 });
    if (campaign.owner_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // ---- Build recipient set (email -> name) ----
    const recipients = new Map();
    const listIds = Array.isArray(campaign.list_ids) ? campaign.list_ids : [];
    for (const listId of listIds) {
      const contacts = await base44.entities.EmailListContact.filter({ list_id: listId, owner_id: user.id, status: 'subscribed' }, '-created_date', 500);
      for (const c of contacts) {
        const em = (c.email || '').toLowerCase().trim();
        if (em) recipients.set(em, c.name || '');
      }
    }
    if (campaign.include_event_attendees && campaign.event_id) {
      const rsvps = await base44.entities.RSVP.filter({ event_id: campaign.event_id, status: 'going' }, '-created_date', 500);
      for (const r of rsvps) {
        const em = (r.attendee_email || '').toLowerCase().trim();
        if (em) recipients.set(em, r.attendee_name || '');
      }
      const orders = await base44.entities.TicketOrder.filter({ event_id: campaign.event_id, payment_status: 'completed' }, '-created_date', 500);
      for (const o of orders) {
        const em = (o.buyer_email || '').toLowerCase().trim();
        if (em) recipients.set(em, o.buyer_name || '');
      }
    }

    // Remove unsubscribed / bounced
    const sups = await base44.entities.EmailSuppression.list('-created_date', 2000);
    for (const s of sups) {
      const em = (s.email || '').toLowerCase().trim();
      if (em) recipients.delete(em);
    }

    const total = recipients.size;
    await base44.entities.EmailCampaign.update(campaign_id, { status: 'sending', total_recipients: total, sent_count: 0, failed_count: 0, error: '' });
    if (total === 0) {
      await base44.entities.EmailCampaign.update(campaign_id, { status: 'sent', sent_date: new Date().toISOString() });
      return Response.json({ status: 'sent', sent: 0, failed: 0, total: 0 });
    }

    // Event details for the email card
    let event = null;
    if (campaign.event_id) {
      try { event = await base44.entities.Event.get(campaign.event_id); } catch {}
    }

    const u = new URL(req.url);
    const fnBase = u.origin + u.pathname.replace(/\/[^\/]*$/, '');
    const unsubBase = fnBase + '/emailUnsubscribe';
    const trackOpenUrl = fnBase + '/trackOpen';
    const trackClickUrl = fnBase + '/trackClick';
    const appBase = (app_url || u.origin).replace(/\/$/, '');
    const ctaLink = campaign.event_id ? `${appBase}/events/${campaign.event_id}` : appBase;
    const hashEmail = (email) => { let h = 5381; for (let i = 0; i < email.length; i++) h = ((h << 5) + h + email.charCodeAt(i)) >>> 0; return h.toString(36); };

    const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const eventDate = event && event.date ? new Date(event.date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

    const buildHtml = (email, name) => {
      const hash = hashEmail(email);
      const trackedCta = `${trackClickUrl}?c=${encodeURIComponent(campaign_id)}&h=${hash}&u=${encodeURIComponent(ctaLink)}`;
      const greeting = name ? `Hi ${esc(name)},` : "You're invited,";
      const eventCard = event ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:#f6f7f9;border-radius:14px;">
          <tr><td style="padding:18px 20px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1px;color:#d4580a;text-transform:uppercase;">${esc(event.title || '')}</p>
            ${eventDate ? `<p style="margin:0 0 4px;font-size:14px;color:#1a1f2e;">${esc(eventDate)}</p>` : ''}
            ${event.venue_name ? `<p style="margin:0;font-size:13px;color:#5a6276;">${esc(event.venue_name)}</p>` : ''}
          </td></tr>
        </table>` : '';
      return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,Helvetica,Arial,sans-serif;color:#1a1f2e;">
  <div style="max-width:560px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 18px;font-size:13px;font-weight:700;letter-spacing:2px;color:#d4580a;text-transform:uppercase;">PLANET BALTIMORE</p>
    <p style="font-size:18px;font-weight:700;margin:0 0 10px;">${esc(campaign.subject || '')}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 6px;">${greeting}</p>
    <div style="font-size:15px;line-height:1.6;white-space:pre-wrap;">${campaign.body || ''}</div>
    ${eventCard}
    <div style="text-align:center;margin:28px 0 8px;">
      <a href="${esc(trackedCta)}" style="display:inline-block;padding:14px 30px;background:#d4580a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;border-radius:12px;">${campaign.event_id ? 'Get Tickets / RSVP' : 'View on Planet Baltimore'}</a>
    </div>
    <p style="font-size:11px;color:#8a92a6;margin:22px 0 6px;line-height:1.5;">You received this invitation from ${esc(campaign.from_name || 'a Planet Baltimore organizer')}. If you no longer wish to receive these emails, <a href="${unsubBase}?email=${encodeURIComponent(email)}&campaign=${encodeURIComponent(campaign_id)}" style="color:#d4580a;">unsubscribe here</a>.</p>
    <img src="${trackOpenUrl}?c=${encodeURIComponent(campaign_id)}&h=${hash}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />
  </div>
</body></html>`;
    };

    const from = `${campaign.from_name || 'Planet Baltimore'} <${RESEND_FROM_EMAIL}>`;
    let sent = 0, failed = 0;
    const entries = [...recipients.entries()];
    const CHUNK = 10;
    for (let i = 0; i < entries.length; i += CHUNK) {
      const chunk = entries.slice(i, i + CHUNK);
      const results = await Promise.allSettled(chunk.map(async ([email, name]) => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: email, subject: campaign.subject, html: buildHtml(email, name), tags: [{ name: 'campaign', value: campaign_id }] }),
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(`${res.status} ${t}`);
        }
        return true;
      }));
      for (const r of results) { if (r.status === 'fulfilled') sent++; else failed++; }
      await base44.entities.EmailCampaign.update(campaign_id, { sent_count: sent, failed_count: failed });
    }

    await base44.entities.EmailCampaign.update(campaign_id, { status: 'sent', sent_date: new Date().toISOString(), sent_count: sent, failed_count: failed });
    return Response.json({ status: 'sent', sent, failed, total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});