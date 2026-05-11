import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, TrendingUp, Ticket, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import PromoterEventCard from '@/components/promoter/PromoterEventCard';
import PromoterSalesAnalytics from '@/components/promoter/PromoterSalesAnalytics';
import PromoCodeManager from '@/components/promoter/PromoCodeManager';
import PromoterMessageTool from '@/components/promoter/PromoterMessageTool';
import PromoterSocialSharing from '@/components/promoter/PromoterSocialSharing';

export default function PromoterDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: promoterRecords = [], isLoading: loadingPromoter } = useQuery({
    queryKey: ['my-promotions', currentUser?.id],
    queryFn: () => base44.entities.Promoter.filter({ promoter_id: currentUser?.id }, '-created_date', 50),
    enabled: !!currentUser?.id,
  });

  const eventIds = promoterRecords.map(p => p.event_id);

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['promoter-events', eventIds],
    queryFn: async () => {
      if (eventIds.length === 0) return [];
      const results = await Promise.all(
        eventIds.map(id => base44.entities.Event.filter({ id }))
      );
      return results.map(r => r[0]).filter(Boolean);
    },
    enabled: eventIds.length > 0,
  });

  const { data: salesData = {} } = useQuery({
    queryKey: ['promoter-sales', eventIds],
    queryFn: async () => {
      if (eventIds.length === 0) return {};
      const data = {};
      for (const eventId of eventIds) {
        const sales = await base44.entities.TicketSale.filter({ event_id: eventId, sold_by_promoter_id: currentUser?.id }, '-created_date', 100);
        data[eventId] = sales;
      }
      return data;
    },
    enabled: eventIds.length > 0 && !!currentUser?.id,
  });

  const totalTicketsSold = Object.values(salesData).flat().reduce((sum, sale) => sum + (sale.quantity || 0), 0);
  const totalRevenue = Object.values(salesData).flat().reduce((sum, sale) => sum + (sale.commission_amount || 0), 0);
  const totalEventsPromoting = events.length;

  const isLoading = loadingPromoter || loadingEvents;

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden p-8" style={{ backgroundColor: '#d4580a' }}>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Promoter Dashboard</h1>
            <p className="text-sm text-white/80 mt-1">Track your sales, commissions, and event performance</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Commission Earned" value={`$${totalRevenue.toFixed(2)}`} color="text-accent" />
          <StatCard icon={Ticket} label="Tickets Sold" value={totalTicketsSold.toString()} color="text-primary" />
          <StatCard icon={Users} label="Events Promoting" value={totalEventsPromoting.toString()} color="text-blue-500" />
          <StatCard icon={TrendingUp} label="Avg per Event" value={`${(totalTicketsSold / Math.max(totalEventsPromoting, 1)).toFixed(0)} tickets`} color="text-green-500" />
        </div>
      )}

      {/* Events & Analytics */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="w-full bg-secondary/50 rounded-xl grid grid-cols-5">
          <TabsTrigger value="events" className="rounded-lg text-xs sm:text-sm">My Events</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg text-xs sm:text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="promo" className="rounded-lg text-xs sm:text-sm">Promo Codes</TabsTrigger>
          <TabsTrigger value="messaging" className="rounded-lg text-xs sm:text-sm">Message</TabsTrigger>
          <TabsTrigger value="social" className="rounded-lg text-xs sm:text-sm">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4 space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>You're not promoting any events yet.</p>
            </div>
          ) : (
            events.map(event => (
              <PromoterEventCard
                key={event.id}
                event={event}
                sales={salesData[event.id] || []}
                promoterRecord={promoterRecords.find(p => p.event_id === event.id)}
                onSelect={() => setSelectedEventId(event.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <PromoterSalesAnalytics events={events} salesData={salesData} />
        </TabsContent>

        <TabsContent value="promo" className="mt-4">
          {selectedEventId ? (
            <PromoCodeManager eventId={selectedEventId} />
          ) : events.length > 0 ? (
            <div className="bg-secondary/30 border border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground mb-4">Select an event from "My Events" to manage promotional codes</p>
              <Button variant="outline" onClick={() => document.querySelector('[value="events"]')?.click()}>
                View Events
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No events available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="messaging" className="mt-4">
          {selectedEventId && events.find(e => e.id === selectedEventId) ? (
            <PromoterMessageTool eventId={selectedEventId} />
          ) : events.length > 0 ? (
            <div className="bg-secondary/30 border border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground mb-4">Select an event from "My Events" to message attendees</p>
              <Button variant="outline" onClick={() => document.querySelector('[value="events"]')?.click()}>
                View Events
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No events available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="social" className="mt-4">
          {selectedEventId && events.find(e => e.id === selectedEventId) ? (
            <PromoterSocialSharing event={events.find(e => e.id === selectedEventId)} />
          ) : events.length > 0 ? (
            <div className="bg-secondary/30 border border-border rounded-xl p-6 text-center">
              <p className="text-muted-foreground mb-4">Select an event from "My Events" to share on social media</p>
              <Button variant="outline" onClick={() => document.querySelector('[value="events"]')?.click()}>
                View Events
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No events available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color} opacity-20`} />
      </div>
    </div>
  );
}