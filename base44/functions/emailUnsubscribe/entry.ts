import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const u = new URL(req.url);
    const email = (u.searchParams.get('email') || '').toLowerCase().trim();
    const campaignId = u.searchParams.get('campaign') || '';
    if (email) {
      const existing = await base44.asServiceRole.entities.EmailSuppression.filter({ email }, '-created_date', 5);
      if (existing.length === 0) {
        await base44.asServiceRole.entities.EmailSuppression.create({ email, reason: 'unsubscribed', campaign_id: campaignId });
      }
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Unsubscribed</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,Helvetica,Arial,sans-serif;color:#1a1f2e;">
<div style="max-width:440px;margin:0 auto;padding:48px 24px;text-align:center;">
<p style="margin:0 0 18px;font-size:13px;font-weight:700;letter-spacing:2px;color:#d4580a;text-transform:uppercase;">PLANET BALTIMORE</p>
<h1 style="font-size:24px;font-weight:700;margin:0 0 10px;">You're unsubscribed</h1>
<p style="font-size:15px;line-height:1.6;color:#5a6276;margin:0;">You won't receive invitation emails from this list anymore. This may take a few minutes to take effect.</p>
</div></body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch {
    return new Response('Something went wrong. Please try again later.', { status: 500 });
  }
});