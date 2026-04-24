import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipients, subject, message, eventTitle } = await req.json();

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return Response.json({ error: 'No recipients provided' }, { status: 400 });
    }

    if (!subject || !message) {
      return Response.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Send email to each recipient
    const results = await Promise.allSettled(
      recipients.map(email =>
        base44.integrations.Core.SendEmail({
          to: email,
          subject: `[${eventTitle}] ${subject}`,
          body: `${message}\n\n---\nYou received this message because you RSVP'd to ${eventTitle}.`,
          from_name: user.full_name || 'Event Organizer',
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return Response.json({
      sent: successful,
      failed,
      message: `Successfully sent to ${successful} recipient(s)${failed > 0 ? ` (${failed} failed)` : ''}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});