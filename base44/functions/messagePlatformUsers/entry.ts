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

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { subject, body } = await req.json();

    if (!subject || !body) {
      return Response.json({ error: 'Missing subject or body' }, { status: 400 });
    }

    // Fetch all users using service role
    const allUsers = await base44.asServiceRole.entities.User.list();

    let successCount = 0;
    let failureCount = 0;

    for (const recipient of allUsers) {
      if (!recipient.email) { failureCount++; continue; }
      try {
        await base44.integrations.Core.SendEmail({
          to: recipient.email,
          subject: subject,
          body: body,
          from_name: 'Planet Baltimore',
        });
        successCount++;
      } catch {
        failureCount++;
      }
    }

    return Response.json({
      success: true,
      total: allUsers.length,
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error('Platform message error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});