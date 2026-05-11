import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Ticket, Star, TrendingUp, Clock, Filter, ChevronRight, Plus, MessageCircle } from 'lucide-react';
import EventLikeShareButtons from '@/components/events/EventLikeShareButtons';
import CommentSection from '@/components/shared/CommentSection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isAfter } from 'date-fns';

const CATEGORIES = ['All', 'Music', 'Art', 'Community', 'Nightlife', 'Food', 'Wellness', 'Education', 'Sports', 'Networking', 'Festival'];

function EventCard({ event, ticketTypes = [] }) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const lowestPrice = ticketTypes.length > 0
    ? Math.min(...ticketTypes.filter(t => t.is_active && t.price > 0).map(t => t.price))
    : null;
  const isFree = ticketTypes.length > 0 && ticketTypes.every(t => t.price === 0);
  const totalSold = ticketTypes.reduce((s, t) => s + (t.quantity_sold || 0), 0);
  const totalCapacity = ticketTypes.reduce((s, t) => s + (t.quantity_total || 0), 0);
  const soldOutPct = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;

  return (
    <div
      onClick={() => navigate(`/events/${event.id}/tickets`)}
      className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative aspect-[5/3] bg-gradient-to-br from-accent/20 to-primary/10 overflow-hidden">
        {event.image_url && (
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {event.is_featured && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground gap-1">
            <Star className="w-3 h-3" /> Featured
          </Badge>
        )}
        {isFree && (
          <Badge className="absolute top-3 right-3 bg-green-500 text-white border-0">Free</Badge>
        )}
        {soldOutPct >= 90 && (
          <Badge className="absolute top-3 right-3 bg-red-500 text-white border-0">Almost Sold Out</Badge>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-base leading-tight line-clamp-2 drop-shadow">{event.title}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-accent font-semibold mb-1.5">
          <Clock className="w-3.5 h-3.5" />
          {event.date ? format(new Date(event.date), 'EEE, MMM d · h:mm a') : 'Date TBD'}
        </div>
        {event.venue_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{event.venue_name}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            {isFree ? (
              <span className="text-sm font-bold text-green-600">Free</span>
            ) : lowestPrice != null ? (
              <span className="text-sm font-bold text-foreground">From ${lowestPrice.toFixed(2)}</span>
            ) : (
              <span className="text-sm text-muted-foreground">No tickets yet</span>
            )}
          </div>
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs rounded-lg h-8 gap-1">
            <Ticket className="w-3.5 h-3.5" /> Get Tickets
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={e => { e.stopPropagation(); setShowComments(v => !v); }}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${showComments ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageCircle className="w-4 h-4" />
            {showComments ? 'Hide hype' : 'Hype this event'}
          </button>
          <EventLikeShareButtons event={event} />
        </div>
        {totalCapacity > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>{totalSold} sold</span>
              <span>{totalCapacity - totalSold} left</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${Math.min(soldOutPct, 100)}%` }}
              />
            </div>
          </div>
        )}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-border" onClick={e => e.stopPropagation()}>
            <CommentSection targetType="event" targetId={event.id} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function TicketingHub() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['ticketed-events'],
    queryFn: () => base44.entities.Event.filter({ ticketing_mode: 'platform', status: 'upcoming' }, 'date', 100),
    staleTime: 60000,
  });

  const { data: ticketTypeMap = {} } = useQuery({
    queryKey: ['all-ticket-types'],
    queryFn: async () => {
      const all = await base44.entities.TicketType.list('sort_order', 500);
      const map = {};
      all.forEach(tt => {
        if (!map[tt.event_id]) map[tt.event_id] = [];
        map[tt.event_id].push(tt);
      });
      return map;
    },
    staleTime: 60000,
  });

  const filtered = events
    .filter(e => isAfter(new Date(e.date), new Date()))
    .filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.venue_name?.toLowerCase().includes(search.toLowerCase()))
    .filter(e => category === 'All' || e.category?.toLowerCase() === category.toLowerCase());

  const featured = filtered.filter(e => e.is_featured);
  const upcoming = filtered.filter(e => !e.is_featured);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12" style={{ backgroundColor: '#d4580a' }}>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">Your Next Event</h1>
          <p className="text-white/80 text-sm sm:text-base mb-6">Tickets for the best events in Baltimore</p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, venues..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-lg"
            />
          </div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Action Buttons for Organizers */}
      {user && (
        <div className="flex gap-3">
          <Link to="/organizer-studio" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <TrendingUp className="w-4 h-4" /> Organizer Studio
            </Button>
          </Link>
          <Link to="/promoter-dashboard" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <Ticket className="w-4 h-4" /> Promoter Dashboard
            </Button>
          </Link>
          <Link to="/create-event">
            <Button className="text-foreground gap-2" style={{ backgroundColor: '#f4a460' }}>
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </Link>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? 'bg-[#d4580a] text-white shadow-sm'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-secondary animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-accent" /> Featured Events
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featured.map(e => (
                  <EventCard key={e.id} event={e} ticketTypes={ticketTypeMap[e.id] || []} />
                ))}
              </div>
            </div>
          )}

          {/* All Events */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {category === 'All' ? 'All Events' : `${category} Events`}
                <span className="text-sm font-normal text-muted-foreground ml-2">({upcoming.length})</span>
              </h2>
            </div>
            {upcoming.length === 0 && filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No events found{search && ` for "${search}"`}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcoming.map(e => (
                  <EventCard key={e.id} event={e} ticketTypes={ticketTypeMap[e.id] || []} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}