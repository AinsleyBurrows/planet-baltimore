import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const GIF = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  (c) => c.charCodeAt(0)
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const u = new URL(req.url);
    const c = u.searchParams.get('c') || '';
    const h = u.searchParams.get('h') || '';
    if (c && h) {
      try {
        await base44.asServiceRole.entities.EmailCampaign.updateMany(
          { id: c },
          { $inc: { opens_count: 1 }, $addToSet: { open_hashes: h } }
        );
      } catch (_e) {}
    }
    return new Response(GIF, {
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (_e) {
    return new Response(GIF, { headers: { 'Content-Type': 'image/gif' } });
  }
});