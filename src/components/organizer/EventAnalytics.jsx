import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Ticket } from 'lucide-react';

export default function EventAnalytics({ event, tickets, rsvps }) {
  const going = rsvps.filter(r => r.status === 'going').length;
  const interested = rsvps.filter(r => r.status === 'interested').length;
  const totalRsvps = going + interested;

  const ticketData = tickets.map(t => ({
    name: t.name,
    sold: t.quantity_sold || 0,
    remaining: (t.quantity_total || 0) - (t.quantity_sold || 0),
    price: t.price || 0,
  }));

  const totalSold = ticketData.reduce((sum, t) => sum + t.sold, 0);
  const totalRevenue = ticketData.reduce((sum, t) => sum + (t.sold * t.price), 0);

  const rsvpData = [
    { name: 'Going', value: going, fill: '#ff6b35' },
    { name: 'Interested', value: interested, fill: '#ffd166' },
  ];

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Total Attendees</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalRsvps}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-muted-foreground">Tickets Sold</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalSold}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-muted-foreground">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-muted-foreground">Capacity Used</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {event.capacity ? Math.round((totalRsvps / event.capacity) * 100) : 'N/A'}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket sales chart */}
        {ticketData.length > 0 && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">Ticket Sales by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ticketData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="sold" fill="#ff6b35" name="Sold" />
                <Bar dataKey="remaining" fill="#e0e0e0" name="Remaining" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* RSVP breakdown */}
        {totalRsvps > 0 && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">RSVP Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={rsvpData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {rsvpData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}