import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, QrCode, Users, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import CheckInScanner from '@/components/ticketing/CheckInScanner';
import { format } from 'date-fns';

export default function EventCheckIn() {
  const navigate = useNavigate();
  const eventId = window.location.pathname.split('/events/')[1]?.split('/')[0];
  const [user, setUser] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: event, isLoading: loadingEvent } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId,
  });

  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['event-tickets', eventId],
    queryFn: () => base44.entities.Ticket.filter({ event_id: eventId }, '-created_date', 1000),
    enabled: !!eventId,
  });

  const checkedInCount = tickets.filter(t => t.is_checked_in).length;
  const totalAttendees = tickets.length;

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Please sign in to access check-in.</p>
      </div>
    );
  }

  if (loadingEvent) {
    return <Skeleton className="h-64 rounded-xl" />;
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="ghost" onClick={() => navigate('/events')} className="mt-4">Back</Button>
      </div>
    );
  }

  const isOrganizer = user?.id === event.organizer_id;

  if (!isOrganizer) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Only event organizers can access this page.</p>
        <Button variant="ghost" onClick={() => navigate(`/events/${eventId}`)} className="mt-4">Back to Event</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">Check In Attendees</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground">Total Tickets</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalAttendees}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <p className="text-xs text-muted-foreground">Checked In</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
        </div>
      </div>

      {/* Scanner Button */}
      <Button
        onClick={() => setShowScanner(true)}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 rounded-xl font-semibold gap-2"
      >
        <QrCode className="w-5 h-5" />
        Start Scanning
      </Button>

      {/* Checked In List */}
      <div>
        <h2 className="font-semibold text-foreground mb-3">Attendees</h2>
        {loadingTickets ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  ticket.is_checked_in
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{ticket.owner_email}</p>
                  <p className="text-xs text-muted-foreground">{ticket.ticket_number}</p>
                </div>
                {ticket.is_checked_in && (
                  <Badge className="bg-green-600/90 text-white border-0 flex-shrink-0">
                    ✓ Checked in
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <CheckInScanner
          eventId={eventId}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}