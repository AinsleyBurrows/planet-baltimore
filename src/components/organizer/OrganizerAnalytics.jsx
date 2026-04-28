import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { format, startOfDay } from 'date-fns';
import { TrendingUp, DollarSign, Ticket, Users } from 'lucide-react';

const COLORS = ['hsl(var(--accent))', 'hsl(var(--primary))', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function OrganizerAnalytics({ event, orders, tickets, ticketTypes, promoters }) {
  // Revenue over time
  const revenueByDay = orders.reduce((acc, o) => {
    if (!o.created_date) return acc;
    const day = format(startOfDay(new Date(o.created_date)), 'MMM d');
    acc[day] = (acc[day] || 0) + (o.total_amount || 0);
    return acc;
  }, {});
  const revenueChartData = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }));

  // Tickets by type
  const byType = ticketTypes.map(tt => ({
    name: tt.name,
    sold: tt.quantity_sold || 0,
    remaining: (tt.quantity_total || 0) - (tt.quantity_sold || 0),
    revenue: (tt.quantity_sold || 0) * (tt.price || 0),
  }));

  // Hourly sales distribution
  const hourly = orders.reduce((acc, o) => {
    if (!o.created_date) return acc;
    const hour = new Date(o.created_date).getHours();
    acc[hour] = (acc[hour] || 0) + (o.quantity || 0);
    return acc;
  }, {});
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, tickets: hourly[i] || 0 }));

  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
  const totalTickets = orders.reduce((s, o) => s + (o.quantity || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const refundedOrders = orders.filter(o => o.payment_status === 'refunded').length;

  // Promoter breakdown
  const promoterData = promoters.filter(p => (p.total_tickets_sold || 0) > 0).map(p => ({
    name: p.promoter_name,
    value: p.total_tickets_sold || 0,
    commission: p.total_commission_earned || 0,
  }));
  const directSales = totalTickets - promoters.reduce((s, p) => s + (p.total_tickets_sold || 0), 0);
  if (directSales > 0) promoterData.unshift({ name: 'Direct Sales', value: directSales, commission: 0 });

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI icon={DollarSign} label="Gross Revenue" value={`$${totalRevenue.toFixed(2)}`} />
        <KPI icon={Ticket} label="Tickets Sold" value={totalTickets} />
        <KPI icon={TrendingUp} label="Avg Order" value={`$${avgOrderValue.toFixed(2)}`} />
        <KPI icon={Users} label="Refunds" value={refundedOrders} />
      </div>

      {/* Revenue Over Time */}
      {revenueChartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" style={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis style={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ticket Type Breakdown */}
      {byType.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Ticket Type Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" style={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" style={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
              <Tooltip />
              <Bar dataKey="sold" fill="hsl(var(--accent))" name="Sold" radius={[0, 4, 4, 0]} />
              <Bar dataKey="remaining" fill="hsl(var(--secondary))" name="Remaining" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {byType.map(t => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t.name}</span>
                <div className="flex gap-4">
                  <span className="font-medium">{t.sold} sold</span>
                  <span className="text-accent font-semibold">${t.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Promoter vs Direct */}
      {promoterData.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Sales Channels</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={promoterData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}>
                  {promoterData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {promoterData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{p.name}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-medium">{p.value} tickets</span>
                    {p.commission > 0 && <span className="text-blue-600 text-xs">${p.commission.toFixed(2)} commission</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-accent" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}