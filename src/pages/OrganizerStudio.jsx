import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Users, TrendingUp, Loader2, DollarSign, QrCode, Mail, Plus, Clapperboard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EventSelector from '@/components/organizer/EventSelector';
import OrganizerTicketManager from '@/components/organizer/OrganizerTicketManager';
import OrganizerAttendeeList from '@/components/organizer/OrganizerAttendeeList';
import OrganizerPromoterManager from '@/components/organizer/OrganizerPromoterManager';
import OrganizerPayouts from '@/components/organizer/OrganizerPayouts';
import OrganizerCheckIn from '@/components/organizer/OrganizerCheckIn';
import OrganizerAnalytics from '@/components/organizer/OrganizerAnalytics';
import AttendeeMessaging from '@/components/organizer/AttendeeMessaging';
import CreateEventInline from '@/components/organizer/CreateEventInline';

function StatCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground -mt-1">{sub}</p>}
    </div>
  );
}

const TABS = [
  { value: 'tickets',   label: 'Tickets',   Icon: Ticket },
  { value: 'attendees', label: 'Attendees',  Icon: Users },
  { value: 'checkin',   label: 'Check-In',   Icon: QrCode },
  { value: 'message',   label: 'Message',    Icon: Mail },
  { value: 'promoters', label: 'Promoters',  Icon: Users },
  { value: 'payouts',   label: 'Payouts',    Icon: DollarSign },
  { value: 'analytics', label: 'Analytics',  Icon: TrendingUp },
];

export default function OrganizerStudio() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
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
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  const handleDuplicateEvent = async (event) => {
    const { id, created_date, updated_date, rsvp_count, ...rest } = event;
    const copy = {
      ...rest,
      title: `${rest.title} (Copy)`,
      status: 'upcoming',
      rsvp_count: 0,
      organizer_id: currentUser.id,
    };
    const newEvent = await base44.entities.Event.create(copy);
    // Also duplicate ticket types if any exist
    const existingTicketTypes = await base44.entities.TicketType.filter({ event_id: event.id });
    for (const tt of existingTicketTypes) {
      const { id: ttId, created_date: ttCd, updated_date: ttUd, quantity_sold, ...ttRest } = tt;
      await base44.entities.TicketType.create({ ...ttRest, event_id: newEvent.id, quantity_sold: 0 });
    }
    queryClient.invalidateQueries({ queryKey: ['user-events', currentUser?.id] });
    toast({ title: 'Event duplicated', description: `"${newEvent.title}" is ready to edit.` });
  };

  const completedOrders = orders.filter(o => o.payment_status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalTicketsSold = completedOrders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  const platformFees = completedOrders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);
  const netRevenue = totalRevenue - platformFees;
  const checkedIn = tickets.filter(t => t.is_checked_in).length;

  return (
    <div className="space-y-8">

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative rounded-3xl px-6 py-8 overflow-hidden bg-transparent border-2 border-[#d4580a]">
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#d4580a]/10 border border-[#d4580a]/40 flex items-center justify-center">
                <Clapperboard className="w-5 h-5 text-[#d4580a]" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Planet Baltimore</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Organizer Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage events, tickets, promoters &amp; payouts</p>
          </div>
        </div>
      </div>

      {/* ── Top-level tabs: Manage / Create ─────────────────────── */}
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="w-full bg-secondary/50 border border-border rounded-2xl grid grid-cols-2 h-auto gap-1 p-1.5 mb-6">
          <TabsTrigger
            value="manage"
            className="rounded-xl text-sm font-medium py-2.5 transition-all"
          >
            Manage Events
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="rounded-xl text-sm font-medium py-2.5 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Create Event
          </TabsTrigger>
        </TabsList>

        {/* ── CREATE ──────────────────────────────────────────────── */}
        <TabsContent value="create">
          <CreateEventInline
            currentUser={currentUser}
            onCreated={() => queryClient.invalidateQueries({ queryKey: ['user-events', currentUser?.id] })}
          />
        </TabsContent>

        {/* ── MANAGE ──────────────────────────────────────────────── */}
        <TabsContent value="manage" className="space-y-6">
          <EventSelector events={events} selectedEvent={selectedEvent} onSelect={setSelectedEvent} onDuplicate={handleDuplicateEvent} isLoading={eventsLoading} />

          {selectedEvent ? (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Revenue"      value={`$${totalRevenue.toFixed(2)}`}   sub={`$${netRevenue.toFixed(2)} net`}           icon={DollarSign} />
                <StatCard label="Tickets Sold" value={totalTicketsSold}                  sub={`${completedOrders.length} orders`}         icon={Ticket} />
                <StatCard label="Checked In"   value={checkedIn}                         sub={`of ${tickets.length} total`}              icon={QrCode} />
                <StatCard label="Promoters"    value={promoters.filter(p => p.status === 'active').length} sub={`${promoters.reduce((s, p) => s + (p.total_tickets_sold || 0), 0)} via promo`} icon={Users} />
              </div>

              {/* Management Tabs */}
              <Tabs defaultValue="tickets">
                <TabsList className="w-full bg-secondary/50 border border-border rounded-2xl grid grid-cols-4 sm:grid-cols-7 h-auto gap-1 p-1.5">
                  {TABS.map(({ value, label, Icon }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="rounded-xl text-xs sm:text-sm py-2.5 flex flex-col sm:flex-row items-center gap-1 transition-all"
                    >
                      <Icon className="w-3.5 h-3.5 opacity-70" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden text-[10px]">{label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="tickets"   className="mt-5"><OrganizerTicketManager event={selectedEvent} ticketTypes={ticketTypes} /></TabsContent>
                <TabsContent value="attendees" className="mt-5"><OrganizerAttendeeList event={selectedEvent} orders={orders} tickets={tickets} ticketTypes={ticketTypes} /></TabsContent>
                <TabsContent value="checkin"   className="mt-5"><OrganizerCheckIn event={selectedEvent} tickets={tickets} ticketTypes={ticketTypes} orders={orders} /></TabsContent>
                <TabsContent value="message"   className="mt-5"><AttendeeMessaging event={selectedEvent} orders={orders} ticketTypes={ticketTypes} /></TabsContent>
                <TabsContent value="promoters" className="mt-5"><OrganizerPromoterManager event={selectedEvent} promoters={promoters} orders={completedOrders} /></TabsContent>
                <TabsContent value="payouts"   className="mt-5">
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
                <TabsContent value="analytics" className="mt-5"><OrganizerAnalytics event={selectedEvent} orders={completedOrders} tickets={tickets} ticketTypes={ticketTypes} promoters={promoters} /></TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center mb-4">
                <Ticket className="w-7 h-7 text-foreground/30" />
              </div>
              <p className="font-semibold text-foreground">Select an event to manage</p>
              <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">Choose from your events above to view tickets, attendees, and payouts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}