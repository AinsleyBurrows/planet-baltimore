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

    const { recipientIds, subject, body, senderName } = await req.json();

    if (!recipientIds || recipientIds.length === 0 || !body) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Send emails to each recipient
    let successCount = 0;
    let failureCount = 0;
    const results = [];

    for (const recipientId of recipientIds) {
      try {
        // Get recipient user
        const recipient = await base44.entities.User.get(recipientId);
        if (!recipient || !recipient.email) {
          results.push({ recipientId, status: 'failed', error: 'User not found or no email' });
          failureCount++;
          continue;
        }

        // Send email
        await base44.integrations.Core.SendEmail({
          to: recipient.email,
          subject: subject || 'Message from ' + (senderName || user.full_name),
          body: body,
          from_name: senderName || user.full_name,
        });

        results.push({ recipientId, status: 'sent', email: recipient.email });
        successCount++;
      } catch (error) {
        results.push({ recipientId, status: 'failed', error: error.message });
        failureCount++;
      }
    }

    return Response.json({
      success: true,
      totalAttempts: recipientIds.length,
      successCount,
      failureCount,
      results,
    });
  } catch (error) {
    console.error('Bulk message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});