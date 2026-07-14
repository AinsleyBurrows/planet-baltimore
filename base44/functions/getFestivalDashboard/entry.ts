import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const b = base44.asServiceRole;

    // Festival events
    const festivals = await b.entities.Event.filter({ category: 'festival' }, 'date', 200);
    const festivalIds = new Set(festivals.map(f => f.id));

    // Ticket sales + orders (service role, paginated)
    const sales = await b.entities.TicketSale.list('-sale_date', 500);
    const orders = await b.entities.TicketOrder.list('-created_date', 500);

    const festSales = sales.filter(s => festivalIds.has(s.event_id));
    const festOrders = orders.filter(o => festivalIds.has(o.event_id));

    // Aggregate per festival
    const perFestival = festivals.map(f => {
      const fSales = festSales.filter(s => s.event_id === f.id);
      const fOrders = festOrders.filter(o => o.event_id === f.id);
      const ticketsSold = fSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const grossRevenue = fSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const completedOrders = fOrders.filter(o => o.payment_status === 'completed');
      const completedRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const refundedOrders = fOrders.filter(o => o.payment_status === 'refunded' || o.refund_status !== 'none');
      return {
        id: f.id,
        title: f.title,
        date: f.date,
        end_date: f.end_date,
        venue_name: f.venue_name,
        latitude: f.latitude,
        longitude: f.longitude,
        is_free: f.is_free,
        rsvp_count: f.rsvp_count || 0,
        capacity: f.capacity || 0,
        tickets_sold: ticketsSold,
        gross_revenue: grossRevenue,
        completed_revenue: completedRevenue,
        order_count: fOrders.length,
        completed_orders: completedOrders.length,
        refunded_orders: refundedOrders.length,
      };
    });

    // Totals
    const totals = {
      festival_count: festivals.length,
      tickets_sold: perFestival.reduce((s, f) => s + f.tickets_sold, 0),
      gross_revenue: perFestival.reduce((s, f) => s + f.gross_revenue, 0),
      completed_revenue: perFestival.reduce((s, f) => s + f.completed_revenue, 0),
      order_count: festOrders.length,
    };

    // Recent sales (last 20)
    const recentSales = festSales.slice(0, 20).map(s => {
      const order = festOrders.find(o => o.id === s.order_id);
      const festival = festivals.find(f => f.id === s.event_id);
      return {
        sale_date: s.sale_date,
        quantity: s.quantity,
        unit_price: s.unit_price,
        total_amount: s.total_amount,
        festival_title: festival?.title || 'Unknown',
        buyer_name: order?.buyer_name,
        buyer_email: order?.buyer_email,
        payment_status: order?.payment_status,
        order_number: order?.order_number,
      };
    });

    // Vendors with location
    const vendors = await b.entities.BusinessPage.list('-created_date', 500);
    const locatedVendors = vendors
      .filter(v => v.latitude && v.longitude && !v.is_muted)
      .map(v => ({
        id: v.id,
        name: v.name,
        category: v.category,
        address: v.address,
        neighborhood_name: v.neighborhood_name,
        latitude: v.latitude,
        longitude: v.longitude,
        image_url: v.image_url,
        is_verified: v.is_verified,
      }));

    return Response.json({
      totals,
      festivals: perFestival,
      recent_sales: recentSales,
      vendors: locatedVendors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});