import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Ticket, Users, TrendingUp, Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import EventSelector from '@/components/organizer/EventSelector';
import TicketTypeManager from '@/components/organizer/TicketTypeManager';
import PromotorManager from '@/components/organizer/PromotorManager';
import PayoutDashboard from '@/components/organizer/PayoutDashboard';

export default function OrganizerStudio() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['user-events', currentUser?.id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: currentUser.id }, '-date', 50),
    enabled: !!currentUser?.id,
  });

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['ticket-types', selectedEvent?.id],
    queryFn: () => base44.entities.TicketType.filter({ event_id: selectedEvent.id }, 'sort_order', 50),
    enabled: !!selectedEvent?.id,
  });

  const { data: promoters = [] } = useQuery({
    queryKey: ['event-promoters', selectedEvent?.id],
    queryFn: () => base44.entities.Promoter.filter({ event_id: selectedEvent.id, status: 'active' }, '-created_date', 50),
    enabled: !!selectedEvent?.id,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['event-orders', selectedEvent?.id],
    queryFn: () => base44.entities.TicketOrder.filter({ event_id: selectedEvent.id, payment_status: 'completed' }, '-created_date', 100),
    enabled: !!selectedEvent?.id,
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalTicketsSold = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  const platformFees = orders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Organizer Studio</h1>
        <p className="text-muted-foreground mt-1">Manage events, tickets, promoters, and payouts</p>
      </div>

      {/* Event Selector */}
      <EventSelector events={events} selectedEvent={selectedEvent} onSelect={setSelectedEvent} isLoading={eventsLoading} />

      {selectedEvent ? (
        <>
          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Tickets Sold</p>
              <p className="text-2xl font-bold text-foreground">{totalTicketsSold}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Platform Fees</p>
              <p className="text-2xl font-bold text-foreground">${platformFees.toFixed(2)}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Promoters</p>
              <p className="text-2xl font-bold text-foreground">{promoters.length}</p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="tickets">
            <TabsList className="w-full bg-secondary/50 rounded-xl grid grid-cols-4">
              <TabsTrigger value="tickets" className="rounded-lg flex items-center gap-1.5 text-xs sm:text-sm">
                <Ticket className="w-3.5 h-3.5" /> Tickets
              </TabsTrigger>
              <TabsTrigger value="promoters" className="rounded-lg flex items-center gap-1.5 text-xs sm:text-sm">
                <Users className="w-3.5 h-3.5" /> Promoters
              </TabsTrigger>
              <TabsTrigger value="payouts" className="rounded-lg flex items-center gap-1.5 text-xs sm:text-sm">
                <DollarSign className="w-3.5 h-3.5" /> Payouts
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg flex items-center gap-1.5 text-xs sm:text-sm">
                <TrendingUp className="w-3.5 h-3.5" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tickets" className="mt-4">
              <TicketTypeManager event={selectedEvent} ticketTypes={ticketTypes} />
            </TabsContent>

            <TabsContent value="promoters" className="mt-4">
              <PromotorManager event={selectedEvent} promoters={promoters} />
            </TabsContent>

            <TabsContent value="payouts" className="mt-4">
              <PayoutDashboard event={selectedEvent} orders={orders} promoters={promoters} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-4">Event Analytics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Ticket Price</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${totalTicketsSold > 0 ? (totalRevenue / totalTicketsSold).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net Revenue (after fees)</p>
                    <p className="text-2xl font-bold text-accent">
                      ${(totalRevenue - platformFees).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground mb-2">No event selected</p>
          <p className="text-xs text-muted-foreground">Choose an event above to manage tickets and promoters</p>
        </div>
      )}
    </div>
  );
}