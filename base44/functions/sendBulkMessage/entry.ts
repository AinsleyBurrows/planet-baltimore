import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, subject, message, recipientEmails } = await req.json();

    if (!eventId || !subject || !message || !recipientEmails || recipientEmails.length === 0) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user is promoter for this event
    const promoter = await base44.entities.Promoter.filter({
      event_id: eventId,
      promoter_id: user.id,
    });

    if (promoter.length === 0) {
      return Response.json({ error: 'Not authorized for this event' }, { status: 403 });
    }

    // Send emails to all attendees
    const emailPromises = recipientEmails.map(email =>
      base44.integrations.Core.SendEmail({
        to: email,
        subject,
        body: message,
        from_name: `${user.full_name} (Event Promoter)`,
      }).catch(err => ({ error: err.message, email }))
    );

    const results = await Promise.all(emailPromises);
    const successful = results.filter(r => !r.error).length;
    const failed = results.filter(r => r.error).length;

    return Response.json({
      success: true,
      deliveredCount: successful,
      failedCount: failed,
      message: `Sent to ${successful} attendee${successful !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});