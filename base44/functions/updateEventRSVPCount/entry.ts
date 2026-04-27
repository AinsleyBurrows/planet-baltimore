import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Triggered by entity automation when RSVP is created
    if (!body.event) {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    const rsvp = body.data;
    if (!rsvp || !rsvp.event_id) {
      return Response.json({ success: true });
    }

    // Count all RSVPs for this event with status "going"
    const rsVPs = await base44.asServiceRole.entities.RSVP.filter({
      event_id: rsvp.event_id,
      status: 'going',
    });

    const count = rsVPs.length;

    // Update the event's RSVP count
    await base44.asServiceRole.entities.Event.update(rsvp.event_id, {
      rsvp_count: count,
    });

    return Response.json({
      success: true,
      updatedRSVPCount: count,
    });
  } catch (error) {
    console.error('Update RSVP count error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});