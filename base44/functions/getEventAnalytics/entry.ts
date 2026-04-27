import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return Response.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Get event
    const event = await base44.entities.Event.get(eventId);
    if (!event || event.organizer_id !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get ticket orders
    const orders = await base44.asServiceRole.entities.TicketOrder.filter({
      event_id: eventId,
      status: 'completed',
    });

    // Get RSVPs
    const rsvps = await base44.asServiceRole.entities.RSVP.filter({
      event_id: eventId,
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const ticketsSold = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const rsvsCount = rsvps.filter(r => r.status === 'going').length;
    const conversionRate = event.capacity ? ((ticketsSold + rsvsCount) / event.capacity * 100).toFixed(1) : 0;

    return Response.json({
      eventId,
      eventTitle: event.title,
      totalRevenue: totalRevenue.toFixed(2),
      ticketsSold,
      totalOrders: orders.length,
      avgOrderValue: avgOrderValue.toFixed(2),
      rsvpCount: rsvsCount,
      totalAttendees: ticketsSold + rsvsCount,
      capacity: event.capacity,
      conversionRate: conversionRate + '%',
      analytics: {
        byTicketType: await getTicketTypeBreakdown(base44, eventId, orders),
        revenueOverTime: await getRevenueTimeline(base44, orders),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function getTicketTypeBreakdown(base44, eventId, orders) {
  const ticketTypes = await base44.asServiceRole.entities.TicketType.filter({
    event_id: eventId,
  });

  return ticketTypes.map(type => {
    const typeOrders = orders.filter(o => o.ticket_type_id === type.id);
    return {
      typeId: type.id,
      typeName: type.name,
      quantity: typeOrders.reduce((sum, o) => sum + (o.quantity || 0), 0),
      revenue: typeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(2),
    };
  });
}

async function getRevenueTimeline(base44, orders) {
  const grouped = {};
  orders.forEach(order => {
    const date = order.created_date ? order.created_date.split('T')[0] : '';
    if (!grouped[date]) grouped[date] = 0;
    grouped[date] += order.total_amount || 0;
  });
  return Object.entries(grouped).map(([date, revenue]) => ({
    date,
    revenue: revenue.toFixed(2),
  }));
}