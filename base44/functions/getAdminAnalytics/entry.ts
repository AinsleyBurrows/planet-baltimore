import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all analytics data in parallel
    const [users, posts, events, stories, reports] = await Promise.all([
      base44.asServiceRole.entities.User.list('-created_date', 1000),
      base44.asServiceRole.entities.Post.list('-created_date', 1000),
      base44.asServiceRole.entities.Event.list('-date', 1000),
      base44.asServiceRole.entities.Story.list('-created_date', 1000),
      base44.asServiceRole.entities.Report.list('-created_date', 500),
    ]);

    // Calculate metrics
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const newUsersThisWeek = users.filter(u => new Date(u.created_date) > weekAgo).length;
    const activePostsThisWeek = posts.filter(p => new Date(p.created_date) > weekAgo).length;
    const upcomingEvents = events.filter(e => new Date(e.date) > today).length;
    const openReports = reports.filter(r => r.status === 'open').length;

    // Revenue (rough estimate from TicketSale and MarketplaceOrder)
    const [ticketSales, marketplaceOrders] = await Promise.all([
      base44.asServiceRole.entities.TicketSale.list('-created_date', 1000),
      base44.asServiceRole.entities.MarketplaceOrder.list('-created_date', 1000),
    ]);

    const totalRevenue = (ticketSales || []).reduce((sum, t) => sum + (t.amount || 0), 0) +
                        (marketplaceOrders || []).filter(m => m.payment_status === 'completed').reduce((sum, m) => sum + (m.amount || 0), 0);

    // Generate time-series data for the last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      last30Days.push({ date: dateStr });
    }

    // Calculate daily metrics
    const dailyData = last30Days.map(day => {
      const dayStart = new Date(day.date + 'T00:00:00Z');
      const dayEnd = new Date(day.date + 'T23:59:59Z');

      const dailyUsers = users.filter(u => {
        const uDate = new Date(u.created_date);
        return uDate >= dayStart && uDate <= dayEnd;
      }).length;

      const dailyPosts = posts.filter(p => {
        const pDate = new Date(p.created_date);
        return pDate >= dayStart && pDate <= dayEnd;
      }).length;

      const dailySignups = events.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= dayStart && eDate <= dayEnd;
      }).length;

      return {
        date: day.date.slice(5), // Format as MM-DD
        users: dailyUsers,
        posts: dailyPosts,
        signups: dailySignups,
      };
    });

    return Response.json({
      metrics: {
        totalUsers: users.length,
        newUsersThisWeek,
        totalPosts: posts.length,
        activePostsThisWeek,
        totalEvents: events.length,
        upcomingEvents,
        totalStories: stories.length,
        openReports,
        totalRevenue,
      },
      chartData: dailyData,
      recentReports: reports.slice(0, 10),
      recentUsers: users.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});