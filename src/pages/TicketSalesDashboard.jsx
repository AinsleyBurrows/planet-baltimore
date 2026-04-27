import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Ticket, Users, TrendingUp, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TicketSalesDashboard() {
  const [selectedEventId, setSelectedEventId] = useState(null);

  const { data: organizedEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.asServiceRole.entities.Event.filter({
        organizer_id: user.id,
      }, '-date', 50);
    },
  });

  const { data: analytics = null, isLoading: analyticsLoading } = useQuery({
    queryKey: ['event-analytics', selectedEventId],
    queryFn: () => base44.functions.invoke('getEventAnalytics', { eventId: selectedEventId }),
    enabled: !!selectedEventId,
    select: (res) => res.data,
  });

  const handleDownloadReport = async () => {
    if (!analytics) return;
    const csv = `Event,${analytics.eventTitle}\nMetric,Value\nTotal Revenue,$${analytics.totalRevenue}\nTickets Sold,${analytics.ticketsSold}\nAvg Order Value,$${analytics.avgOrderValue}\nRSVPs,${analytics.rsvpCount}\nTotal Attendees,${analytics.totalAttendees}\nConversion Rate,${analytics.conversionRate}`;
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `${analytics.eventTitle}-analytics.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Ticket Sales Dashboard</h1>
        {analytics && (
          <Button onClick={handleDownloadReport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download Report
          </Button>
        )}
      </div>

      {/* Event Selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Select Event</h2>
        {eventsLoading ? (
          <Skeleton className="h-12" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {organizedEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  selectedEventId === event.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <p className="font-semibold text-sm text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Cards */}
      {analyticsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${analytics.totalRevenue}</p>
                </div>
                <DollarSign className="w-8 h-8 text-accent/50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Tickets Sold</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{analytics.ticketsSold}</p>
                </div>
                <Ticket className="w-8 h-8 text-accent/50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Attendees</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{analytics.totalAttendees}</p>
                </div>
                <Users className="w-8 h-8 text-accent/50" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Conversion</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{analytics.conversionRate}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent/50" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          {analytics.analytics?.revenueOverTime && analytics.analytics.revenueOverTime.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Revenue Over Time</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.analytics.revenueOverTime}>
                  <CartesianGrid stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Ticket Type Breakdown */}
          {analytics.analytics?.byTicketType && analytics.analytics.byTicketType.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Ticket Type Breakdown</h3>
              <div className="space-y-2">
                {analytics.analytics.byTicketType.map((type) => (
                  <div key={type.typeId} className="flex items-center justify-between p-2 bg-secondary/40 rounded-lg">
                    <span className="text-sm font-medium text-foreground">{type.typeName}</span>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{type.quantity} sold</Badge>
                      <span className="text-sm font-semibold text-accent">${type.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Summary Stats */}
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Avg Order Value</p>
                <p className="text-lg font-bold text-foreground">${analytics.avgOrderValue}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-lg font-bold text-foreground">{analytics.totalOrders}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RSVPs</p>
                <p className="text-lg font-bold text-foreground">{analytics.rsvpCount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="text-lg font-bold text-foreground">{analytics.capacity || 'Unlimited'}</p>
              </div>
            </div>
          </Card>
        </>
      ) : selectedEventId ? (
        <div className="text-center py-12 text-muted-foreground">No analytics data available yet</div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">Select an event to view analytics</div>
      )}
    </div>
  );
}