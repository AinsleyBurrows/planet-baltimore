import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { eventId } = await req.json();
    if (!eventId) return Response.json({ error: 'Missing eventId' }, { status: 400 });

    const event = await base44.asServiceRole.entities.Event.get(eventId);
    if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

    // Fetch all related records in parallel
    const [rsvps, checkIns, likes, comments, followers, ticketOrders] = await Promise.all([
      base44.asServiceRole.entities.RSVP.filter({ event_id: eventId }, '-created_date', 1000),
      base44.asServiceRole.entities.CheckIn.filter({ event_id: eventId }, '-checked_in_at', 1000),
      base44.asServiceRole.entities.Like.filter({ target_type: 'event', target_id: eventId }, '-created_date', 1000),
      base44.asServiceRole.entities.Comment.filter({ target_type: 'event', target_id: eventId }, '-created_date', 1000),
      base44.asServiceRole.entities.Follow.filter({ target_type: 'event', target_id: eventId }, '-created_date', 1000),
      base44.asServiceRole.entities.TicketOrder.filter({ event_id: eventId, status: 'completed' }, '-created_date', 1000).catch(() => []),
    ]);

    // Attendance
    const going = rsvps.filter(r => r.status === 'going').length;
    const interested = rsvps.filter(r => r.status === 'interested').length;
    const notGoing = rsvps.filter(r => r.status === 'not_going').length;
    const ticketsSold = ticketOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
    const capacity = event.capacity || 0;
    const attended = checkIns.length;
    const attendanceRate = capacity > 0 ? Math.round((attended / capacity) * 100) : 0;

    // Engagement
    const likesCount = likes.length;
    const commentsCount = comments.length;
    const followersCount = followers.length;
    const totalEngagement = likesCount + commentsCount + followersCount;

    // Breakdowns
    const rsvpByCity = {};
    rsvps.forEach(r => {
      const city = r.attendee_city || 'Unknown';
      rsvpByCity[city] = (rsvpByCity[city] || 0) + 1;
    });
    const cityBreakdown = Object.entries(rsvpByCity)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const checkInMethods = { qr_scan: 0, manual_search: 0, api: 0 };
    checkIns.forEach(c => {
      if (c.check_in_method) checkInMethods[c.check_in_method] = (checkInMethods[c.check_in_method] || 0) + 1;
    });

    // RSVP timeline (by day)
    const rsvpTimeline = {};
    rsvps.forEach(r => {
      const day = r.created_date ? r.created_date.split('T')[0] : 'unknown';
      rsvpTimeline[day] = (rsvpTimeline[day] || 0) + 1;
    });
    const timeline = Object.entries(rsvpTimeline)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return Response.json({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        venue_name: event.venue_name,
        neighborhood_name: event.neighborhood_name,
        category: event.category,
        capacity,
        status: event.status,
        is_virtual: event.is_virtual,
      },
      attendance: {
        going,
        interested,
        notGoing,
        totalRSVPs: rsvps.length,
        checkIns: attended,
        ticketsSold,
        capacity,
        attendanceRate,
      },
      engagement: {
        likes: likesCount,
        comments: commentsCount,
        followers: followersCount,
        totalEngagement,
      },
      breakdowns: {
        rsvpByCity: cityBreakdown,
        checkInMethods,
        rsvpTimeline: timeline,
      },
      recentActivity: {
        rsvps: rsvps.slice(0, 8).map(r => ({
          id: r.id,
          name: r.attendee_name || 'Attendee',
          status: r.status,
          city: r.attendee_city,
          date: r.created_date,
        })),
        comments: comments.slice(0, 8).map(c => ({
          id: c.id,
          author: c.author_name || 'User',
          content: c.content,
          date: c.created_date,
        })),
        checkIns: checkIns.slice(0, 8).map(c => ({
          id: c.id,
          method: c.check_in_method,
          at: c.checked_in_at,
        })),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});