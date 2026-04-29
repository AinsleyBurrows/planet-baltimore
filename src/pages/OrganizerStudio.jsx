import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Users, TrendingUp, Loader2, DollarSign, QrCode, Settings, ChevronDown, Mail, Plus } from 'lucide-react';
import EventSelector from '@/components/organizer/EventSelector';
import OrganizerTicketManager from '@/components/organizer/OrganizerTicketManager';
import OrganizerAttendeeList from '@/components/organizer/OrganizerAttendeeList';
import OrganizerPromoterManager from '@/components/organizer/OrganizerPromoterManager';
import OrganizerPayouts from '@/components/organizer/OrganizerPayouts';
import OrganizerCheckIn from '@/components/organizer/OrganizerCheckIn';
import OrganizerAnalytics from '@/components/organizer/OrganizerAnalytics';
import AttendeeMessaging from '@/components/organizer/AttendeeMessaging';
import CreateEventInline from '@/components/organizer/CreateEventInline';

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

  const { data: orders = [] } = useQuery({
    queryKey: ['event-orders', selectedEvent?.id],
    queryFn: () => base44.entities.TicketOrder.filter({ event_id: selectedEvent.id }, '-created_date', 500),
    enabled: !!selectedEvent?.id,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['event-tickets', selectedEvent?.id],
    queryFn: () => base44.entities.Ticket.filter({ event_id: selectedEvent.id }, '-created_date', 500),
    enabled: !!selectedEvent?.id,
  });

  const { data: promoters = [] } = useQuery({
    queryKey: ['event-promoters', selectedEvent?.id],
    queryFn: () => base44.entities.Promoter.filter({ event_id: selectedEvent.id }, '-created_date', 50),
    enabled: !!selectedEvent?.id,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['event-payouts', selectedEvent?.id],
    queryFn: () => base44.entities.Payout.filter({ event_id: selectedEvent.id }, '-created_date', 20),
    enabled: !!selectedEvent?.id,
  });

  if (!currentUser) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  const completedOrders = orders.filter(o => o.payment_status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalTicketsSold = completedOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  const platformFees = completedOrders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);
  const netRevenue = totalRevenue - platformFees;
  const checkedIn = tickets.filter(t => t.is_checked_in).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Organizer Studio</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage events, tickets, promoters, and payouts</p>
        </div>
      </div>

      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="w-full bg-secondary/50 rounded-xl grid grid-cols-2 h-auto gap-1 p-1 mb-4">
          <TabsTrigger value="manage" className="rounded-lg text-sm">Manage Events</TabsTrigger>
          <TabsTrigger value="create" className="rounded-lg text-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Create Event</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <CreateEventInline currentUser={currentUser} onCreated={(event) => { queryClient.invalidateQueries({ queryKey: ['user-events', currentUser?.id] }); }} />
        </TabsContent>

        <TabsContent value="manage">
      <EventSelector events={events} selectedEvent={selectedEvent} onSelect={setSelectedEvent} isLoading={eventsLoading} />

      {selectedEvent ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Revenue" value={`$${totalRevenue.toFixed(2)}`} sub={`$${netRevenue.toFixed(2)} net`} color="text-accent" />
            <StatCard label="Tickets Sold" value={totalTicketsSold} sub={`${completedOrders.length} orders`} color="text-primary" />
            <StatCard label="Checked In" value={checkedIn} sub={`of ${tickets.length} total`} color="text-green-600" />
            <StatCard label="Promoters" value={promoters.filter(p => p.status === 'active').length} sub={`${promoters.reduce((s, p) => s + (p.total_tickets_sold || 0), 0)} tickets via promo`} color="text-blue-500" />
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="tickets">
            <TabsList className="w-full bg-secondary/50 rounded-xl grid grid-cols-4 sm:grid-cols-7 h-auto gap-1 p-1">
              <TabsTrigger value="tickets" className="rounded-lg text-xs sm:text-sm flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5 hidden sm:block" /> Tickets
              </TabsTrigger>
              <TabsTrigger value="attendees" className="rounded-lg text-xs sm:text-sm flex items-center gap-1">
                <Users className="w-3.5 h-3.5 hidden sm:block" /> Attendees
              </TabsTrigger>
              <TabsTrigger value="checkin" className="rounded-lg text-xs sm:text-sm flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 hidden sm:block" /> Check-In
              </TabsTrigger>
              <TabsTrigger value="message" className="rounded-lg text-xs sm:text-sm flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 hidden sm:block" /> Message
              </TabsTrigger>
              <TabsTrigger value="promoters" className="rounded-lg text-xs sm:text-sm flex items-center gap-1">
                <Users className="w-3.5 h-3.5 hidden sm:block" /> Promoters
              </TabsTrigger>
              <TabsTrigger value="payouts" className="rounded-lg text-xs sm:text-sm flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 hidden sm:block" /> Payouts
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg text-xs sm:text-sm flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 hidden sm:block" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tickets" className="mt-4">
              <OrganizerTicketManager event={selectedEvent} ticketTypes={ticketTypes} />
            </TabsContent>

            <TabsContent value="attendees" className="mt-4">
              <OrganizerAttendeeList event={selectedEvent} orders={orders} tickets={tickets} ticketTypes={ticketTypes} />
            </TabsContent>

            <TabsContent value="checkin" className="mt-4">
              <OrganizerCheckIn event={selectedEvent} tickets={tickets} ticketTypes={ticketTypes} orders={orders} />
            </TabsContent>

            <TabsContent value="message" className="mt-4">
              <AttendeeMessaging event={selectedEvent} orders={orders} ticketTypes={ticketTypes} />
            </TabsContent>

            <TabsContent value="promoters" className="mt-4">
              <OrganizerPromoterManager event={selectedEvent} promoters={promoters} orders={completedOrders} />
            </TabsContent>

            <TabsContent value="payouts" className="mt-4">
              <OrganizerPayouts
                event={selectedEvent}
                orders={completedOrders}
                promoters={promoters}
                payouts={payouts}
                currentUser={currentUser}
                totalRevenue={totalRevenue}
                platformFees={platformFees}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <OrganizerAnalytics event={selectedEvent} orders={completedOrders} tickets={tickets} ticketTypes={ticketTypes} promoters={promoters} />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
          <p className="text-muted-foreground mb-2 font-medium">Select an event to manage</p>
          <p className="text-xs text-muted-foreground">Choose from your events above to view tickets, attendees, and payouts</p>
        </div>
      )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}