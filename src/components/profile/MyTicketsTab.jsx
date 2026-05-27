import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Clock, Download, CheckCircle2, QrCode, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isFuture, isPast, isToday } from 'date-fns';
import html2canvas from 'html2canvas';

function DigitalPass({ ticket, event, ticketType, onClose }) {
  const passRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!passRef.current) return;
    setDownloading(true);
    const canvas = await html2canvas(passRef.current, { scale: 2, backgroundColor: null });
    const link = document.createElement('a');
    link.download = `ticket-${ticket.ticket_number?.replace(/\s/g, '-') || ticket.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
        {/* The pass itself */}
        <div ref={passRef} className="bg-gradient-to-br from-primary to-accent rounded-2xl overflow-hidden shadow-2xl text-white">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/20">
            <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Planet Baltimore</p>
            <h2 className="font-bold text-lg leading-tight">{event?.title}</h2>
          </div>
          {/* Body */}
          <div className="px-6 py-4 space-y-3">
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs opacity-60 uppercase tracking-wider">Date</p>
                <p className="font-semibold text-sm mt-0.5">
                  {event?.date ? format(new Date(event.date), 'EEE, MMM d yyyy') : '—'}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs opacity-60 uppercase tracking-wider">Time</p>
                <p className="font-semibold text-sm mt-0.5">
                  {event?.date ? format(new Date(event.date), 'h:mm a') : '—'}
                </p>
              </div>
            </div>
            {event?.venue_name && (
              <div>
                <p className="text-xs opacity-60 uppercase tracking-wider">Venue</p>
                <p className="font-semibold text-sm mt-0.5">{event.venue_name}</p>
              </div>
            )}
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-xs opacity-60 uppercase tracking-wider">Ticket Type</p>
                <p className="font-semibold text-sm mt-0.5">{ticketType?.name || 'General Admission'}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs opacity-60 uppercase tracking-wider">Ticket #</p>
                <p className="font-semibold text-sm mt-0.5">{ticket.ticket_number}</p>
              </div>
            </div>
          </div>
          {/* Divider with holes */}
          <div className="relative flex items-center my-1">
            <div className="w-5 h-5 bg-black/40 rounded-full -ml-2.5" />
            <div className="flex-1 border-t-2 border-dashed border-white/30 mx-1" />
            <div className="w-5 h-5 bg-black/40 rounded-full -mr-2.5" />
          </div>
          {/* QR / Code section */}
          <div className="px-6 py-5 flex items-center gap-5">
            <div className="bg-white rounded-xl p-2 flex-shrink-0">
              {ticket.qr_code_url ? (
                <img src={ticket.qr_code_url} alt="QR" className="w-20 h-20" />
              ) : (
                <div className="w-20 h-20 flex flex-col items-center justify-center gap-1">
                  <QrCode className="w-10 h-10 text-primary" />
                  <p className="text-[9px] text-primary font-mono text-center leading-tight">{ticket.unique_code}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs opacity-60 uppercase tracking-wider mb-1">Entry Code</p>
              <p className="font-mono font-bold text-base tracking-widest">{ticket.unique_code}</p>
              {ticket.is_checked_in && (
                <div className="flex items-center gap-1 mt-2 text-green-300 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />Used
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Button onClick={handleDownload} disabled={downloading} className="flex-1 bg-white text-primary hover:bg-white/90 font-semibold">
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Saving...' : 'Download Pass'}
          </Button>
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-white/20">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function TicketCard({ ticket, event, ticketType }) {
  const [showPass, setShowPass] = useState(false);
  const isUpcoming = event?.date ? isFuture(new Date(event.date)) : false;
  const isPastEvent = event?.date ? isPast(new Date(event.date)) : false;
  const isTodayEvent = event?.date ? isToday(new Date(event.date)) : false;

  return (
    <>
      <div className={`bg-card border rounded-xl overflow-hidden transition-all ${isTodayEvent ? 'border-accent ring-1 ring-accent/30' : 'border-border'}`}>
        <div className="flex">
          {/* Color stripe */}
          <div className={`w-1.5 flex-shrink-0 ${isPastEvent ? 'bg-muted-foreground/30' : isTodayEvent ? 'bg-accent' : 'bg-primary'}`} />
          {/* Event image */}
          {event?.image_url && (
            <div className="w-20 flex-shrink-0">
              <img src={event.image_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {/* Info */}
          <div className="flex-1 px-4 py-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {isTodayEvent && <Badge className="bg-accent text-accent-foreground text-xs px-2 py-0">Today!</Badge>}
                  {isPastEvent && <Badge variant="secondary" className="text-xs px-2 py-0">Past</Badge>}
                  {ticket.is_checked_in && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-2 py-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />Checked In
                    </Badge>
                  )}
                </div>
                <Link to={`/events/${ticket.event_id}`} className="font-semibold text-sm text-foreground hover:text-accent transition-colors line-clamp-1">
                  {event?.title || 'Loading...'}
                </Link>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {event?.date && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />{format(new Date(event.date), 'MMM d, yyyy · h:mm a')}
                    </span>
                  )}
                  {event?.venue_name && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{event.venue_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{ticketType?.name || 'General Admission'} · {ticket.ticket_number}</p>
              </div>
            </div>
          </div>
          {/* Download button */}
          <div className="flex-shrink-0 flex items-center pr-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPass(true)}
              className="text-xs h-8 gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pass</span>
            </Button>
          </div>
        </div>
      </div>

      {showPass && event && (
        <DigitalPass
          ticket={ticket}
          event={event}
          ticketType={ticketType}
          onClose={() => setShowPass(false)}
        />
      )}
    </>
  );
}

export default function MyTicketsTab({ userId }) {
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' | 'past' | 'all'

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['my-tickets', userId],
    queryFn: () => base44.entities.Ticket.filter({ owner_id: userId }, '-created_date', 100),
    enabled: !!userId,
    staleTime: 30000,
  });

  const eventIds = [...new Set(tickets.map(t => t.event_id))];
  const ticketTypeIds = [...new Set(tickets.map(t => t.ticket_type_id))];

  const { data: events = [] } = useQuery({
    queryKey: ['ticket-events', eventIds.join(',')],
    queryFn: async () => {
      if (!eventIds.length) return [];
      const all = await base44.entities.Event.list('-date', 500);
      return all.filter(e => eventIds.includes(e.id));
    },
    enabled: eventIds.length > 0,
    staleTime: 60000,
  });

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['ticket-types', ticketTypeIds.join(',')],
    queryFn: async () => {
      if (!ticketTypeIds.length) return [];
      const all = await base44.entities.TicketType.list('name', 500);
      return all.filter(t => ticketTypeIds.includes(t.id));
    },
    enabled: ticketTypeIds.length > 0,
    staleTime: 60000,
  });

  const eventsMap = Object.fromEntries(events.map(e => [e.id, e]));
  const typesMap = Object.fromEntries(ticketTypes.map(t => [t.id, t]));

  const now = new Date();
  const filteredTickets = tickets.filter(t => {
    const event = eventsMap[t.event_id];
    if (!event) return filter === 'all';
    const d = new Date(event.date);
    if (filter === 'upcoming') return d >= now;
    if (filter === 'past') return d < now;
    return true;
  });

  // Sort: upcoming = soonest first, past = most recent first
  filteredTickets.sort((a, b) => {
    const da = new Date(eventsMap[a.event_id]?.date || 0);
    const db = new Date(eventsMap[b.event_id]?.date || 0);
    return filter === 'past' ? db - da : da - db;
  });

  const upcomingCount = tickets.filter(t => eventsMap[t.event_id] && new Date(eventsMap[t.event_id].date) >= now).length;

  if (isLoading) {
    return (
      <div className="space-y-3 mt-2">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Ticket className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">No tickets yet</p>
        <p className="text-sm text-muted-foreground">Your purchased tickets will appear here.</p>
        <Link to="/community-calendar">
          <Button variant="outline" size="sm" className="mt-2">Browse Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {upcomingCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20">
          <Clock className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="text-sm text-accent font-medium">
            {upcomingCount} upcoming event{upcomingCount !== 1 ? 's' : ''} — don't forget to save your passes!
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past' },
          { id: 'all', label: 'All' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Ticket list */}
      {filteredTickets.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No {filter} tickets.</p>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              event={eventsMap[ticket.event_id]}
              ticketType={typesMap[ticket.ticket_type_id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}