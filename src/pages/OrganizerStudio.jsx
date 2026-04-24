import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, Send, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import EventAnalytics from '@/components/organizer/EventAnalytics';
import AttendeeManager from '@/components/organizer/AttendeeManager';
import BulkMessaging from '@/components/organizer/BulkMessaging';
import ProducerTrustWidget from '@/components/organizer/ProducerTrustWidget';
import ComparisonWidget from '@/components/organizer/ComparisonWidget';

export default function OrganizerStudio() {
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['my-events', user?.id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: user.id }, '-date', 100),
    enabled: !!user?.id,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets', selectedEvent?.id],
    queryFn: () => base44.entities.Ticket.filter({ event_id: selectedEvent.id }),
    enabled: !!selectedEvent?.id,
  });

  const { data: rsvps = [] } = useQuery({
    queryKey: ['rsvps', selectedEvent?.id],
    queryFn: () => base44.entities.RSVP.filter({ event_id: selectedEvent.id }),
    enabled: !!selectedEvent?.id,
  });

  if (!user) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  if (selectedEvent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setSelectedEvent(null)}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
            aria-label="Back to events"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{selectedEvent.title}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(selectedEvent.date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'attendees', label: 'Attendees', icon: Users },
            { id: 'messaging', label: 'Send Update', icon: Send },
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <EventAnalytics event={selectedEvent} tickets={tickets} rsvps={rsvps} />
        )}
        {activeTab === 'attendees' && (
          <AttendeeManager eventId={selectedEvent.id} tickets={tickets} rsvps={rsvps} />
        )}
        {activeTab === 'messaging' && (
          <BulkMessaging eventId={selectedEvent.id} eventTitle={selectedEvent.title} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Organizer Studio</h1>
        <p className="text-muted-foreground">Manage your events, view analytics, and engage with attendees</p>
      </div>

      {/* Events list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="space-y-6">
          <div className="text-center py-16 bg-secondary/30 rounded-xl">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold text-foreground mb-2">No events yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first event to start managing</p>
            <Link to="/create-event">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Create Event</Button>
            </Link>
          </div>
          
          {/* Trust widget on empty state */}
          <ProducerTrustWidget />

          {/* Comparison widget */}
          <ComparisonWidget />
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map(event => {
            const eventTickets = tickets.filter(t => t.event_id === event.id);
            const totalSold = eventTickets.reduce((sum, t) => sum + (t.quantity_sold || 0), 0);
            const eventRsvps = rsvps.filter(r => r.event_id === event.id);
            const going = eventRsvps.filter(r => r.status === 'going').length;

            return (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="p-5 rounded-xl bg-card border border-border hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors text-lg">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(event.date), 'EEE, MMM d · h:mm a')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {event.ticketing_mode === 'platform' ? 'Paid/Free' : 'RSVP'}
                  </Badge>
                </div>

                <div className="flex gap-6 pt-3 border-t border-border">
                  {event.ticketing_mode === 'platform' && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Tickets Sold</p>
                      <p className="text-lg font-semibold text-foreground">{totalSold}</p>
                    </div>
                  )}
                  <div className="text-sm">
                    <p className="text-muted-foreground">RSVPs Going</p>
                    <p className="text-lg font-semibold text-foreground">{going}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Total Interest</p>
                    <p className="text-lg font-semibold text-foreground">{eventRsvps.length}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}