import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function PromoterSalesAnalytics({ events, salesData }) {
  // Chart data for bar chart (tickets sold per event)
  const barChartData = events.map(event => {
    const sales = salesData[event.id] || [];
    const ticketsSold = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const commission = sales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
    return {
      name: event.title.slice(0, 15),
      tickets: ticketsSold,
      commission: Math.round(commission * 100) / 100,
    };
  });

  // Chart data for pie chart (commission distribution)
  const pieChartData = events
    .map(event => {
      const sales = salesData[event.id] || [];
      const commission = sales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
      return {
        name: event.title.slice(0, 12),
        value: Math.round(commission * 100) / 100,
      };
    })
    .filter(item => item.value > 0);

  const totalCommission = pieChartData.reduce((sum, item) => sum + item.value, 0);

  const COLORS = ['#ff6b5a', '#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (barChartData.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No sales data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tickets Sold Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          Tickets Sold by Event
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              cursor={{ fill: 'rgba(79, 70, 229, 0.1)' }}
            />
            <Legend />
            <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Commission Distribution */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Commission Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Commission Summary */}
          <div className="space-y-3">
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Total Commission Earned</p>
              <p className="text-2xl font-bold text-accent">${totalCommission.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              {pieChartData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold text-accent">${item.value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}