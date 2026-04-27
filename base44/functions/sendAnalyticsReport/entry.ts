import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { organizerId, eventId } = body;

    if (!organizerId || !eventId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get analytics
    const analyticsRes = await base44.asServiceRole.functions.invoke('getEventAnalytics', {
      eventId,
    });

    const analytics = analyticsRes.data;
    const organizer = await base44.entities.User.get(organizerId);

    if (!organizer) {
      return Response.json({ error: 'Organizer not found' }, { status: 404 });
    }

    // Format email body
    const emailBody = `
Hi ${organizer.full_name},

Here's your event analytics for "${analytics.eventTitle}":

📊 SALES OVERVIEW
├─ Total Revenue: $${analytics.totalRevenue}
├─ Tickets Sold: ${analytics.ticketsSold}
├─ Total Orders: ${analytics.totalOrders}
└─ Avg Order Value: $${analytics.avgOrderValue}

👥 ATTENDANCE
├─ RSVPs: ${analytics.rsvpCount}
├─ Total Attendees: ${analytics.totalAttendees}
├─ Capacity: ${analytics.capacity || 'Unlimited'}
└─ Conversion Rate: ${analytics.conversionRate}

View full analytics dashboard: ${process.env.APP_URL || 'https://planetbaltimore.com'}/organizer-studio

Best,
Planet Baltimore Team
    `.trim();

    // Send email
    await base44.integrations.Core.SendEmail({
      to: organizer.email,
      subject: `Analytics Report: ${analytics.eventTitle}`,
      body: emailBody,
      from_name: 'Planet Baltimore',
    });

    return Response.json({ success: true, analyticsSent: true });
  } catch (error) {
    console.error('Analytics report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});