import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Calendar, List, Plus, MapPin, Filter, Building2, Users, Palette, X, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, getDay } from 'date-fns';

const EVENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
  { value: 'community', label: 'Community' },
  { value: 'education', label: 'Education' },
  { value: 'food', label: 'Food' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'family', label: 'Family' },
  { value: 'festival', label: 'Festival' },
  { value: 'networking', label: 'Networking' },
  { value: 'activism', label: 'Activism' },
  { value: 'sports', label: 'Sports' },
];

const POSTER_TYPES = [
  { value: 'all', label: 'All Organizers', icon: Calendar },
  { value: 'business', label: 'Businesses', icon: Building2 },
  { value: 'community', label: 'Communities', icon: Users },
  { value: 'arts', label: 'Arts Orgs', icon: Palette },
];

function MiniCalendar({ currentMonth, events, selectedDay, onSelectDay, onPrevMonth, onNextMonth }) {
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startPad = getDay(startOfMonth(currentMonth));

  const eventDays = new Set(
    events.map(e => e.date ? format(new Date(e.date), 'yyyy-MM-dd') : null).filter(Boolean)
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">‹</button>
        <h3 className="font-semibold text-sm text-foreground">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">›</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const hasEvent = eventDays.has(key);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);
          return (
            <button
              key={key}
              onClick={() => onSelectDay(isSelected ? null : day)}
              className={`relative aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all
                ${isSelected ? 'bg-accent text-accent-foreground' : today ? 'bg-accent/10 text-accent font-bold' : 'hover:bg-secondary text-foreground'}
              `}
            >
              {format(day, 'd')}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
      {selectedDay && (
        <button onClick={() => onSelectDay(null)} className="mt-3 w-full text-xs text-muted-foreground hover:text-accent flex items-center justify-center gap-1 transition-colors">
          <X className="w-3 h-3" /> Clear date filter
        </button>
      )}
    </div>
  );
}

function ForYouSection({ user }) {
  const { data, isLoading } = useQuery({
    queryKey: ['event-recommendations', user?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEventRecommendations', {});
      return res.data;
    },
    enabled: !!user?.id,
    staleTime: 300000,
  });

  const recommendations = data?.recommendations || [];

  if (!isLoading && recommendations.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <h2 className="font-semibold text-sm text-foreground">For You</h2>
        <Badge variant="secondary" className="text-xs">Personalized</Badge>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="flex-shrink-0 w-64 h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {recommendations.map(event => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="flex-shrink-0 w-64 bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 group"
            >
              <div className="relative h-28 bg-gradient-to-br from-accent/20 to-primary/10 overflow-hidden">
                {event.image_url && (
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                )}
                {event.category && (
                  <Badge className="absolute top-2 left-2 bg-black/50 text-white border-0 backdrop-blur-sm text-xs capitalize">
                    {event.category}
                  </Badge>
                )}
                {event.score && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-accent/90 text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5" /> {event.score}/10
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">{event.title}</p>
                <p className="text-[10px] text-accent mt-0.5 font-medium">
                  {event.date ? format(new Date(event.date), 'EEE, MMM d') : 'Date TBD'}
                </p>
                {event.reason && (
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 italic">"{event.reason}"</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="border-b border-border mt-4" />
    </div>
  );
}

export default function CommunityCalendar() {
  const [viewMode, setViewMode] = useState('list');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPoster, setSelectedPoster] = useState('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['community-calendar-events'],
    queryFn: () => base44.entities.Event.list('date', 200),
    staleTime: 60000,
  });

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => base44.entities.Neighborhood.list('name', 200),
  });

  // Get organizer types based on whether they have associated pages
  const { data: businesses = [] } = useQuery({
    queryKey: ['biz-ids'],
    queryFn: () => base44.entities.BusinessPage.list('name', 500),
    staleTime: 120000,
  });
  const { data: communities = [] } = useQuery({
    queryKey: ['comm-ids'],
    queryFn: () => base44.entities.Community.list('name', 500),
    staleTime: 120000,
  });
  const { data: artsOrgs = [] } = useQuery({
    queryKey: ['arts-ids'],
    queryFn: () => base44.entities.ArtsOrganization.list('name', 500),
    staleTime: 120000,
  });

  const bizOwnerIds = new Set(businesses.map(b => b.owner_id));
  const commOwnerIds = new Set(communities.map(c => c.owner_id));
  const artsOwnerIds = new Set(artsOrgs.map(a => a.owner_id));

  const upcomingEvents = events.filter(e => e.date && new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));

  const filtered = upcomingEvents.filter(e => {
    const neighborhoodMatch = selectedNeighborhood === 'all' || e.neighborhood_id === selectedNeighborhood;
    const typeMatch = selectedType === 'all' || e.category === selectedType;
    const dayMatch = !selectedDay || (e.date && isSameDay(new Date(e.date), selectedDay));
    const posterMatch = selectedPoster === 'all' ||
      (selectedPoster === 'business' && bizOwnerIds.has(e.organizer_id)) ||
      (selectedPoster === 'community' && commOwnerIds.has(e.organizer_id)) ||
      (selectedPoster === 'arts' && artsOwnerIds.has(e.organizer_id));
    return neighborhoodMatch && typeMatch && dayMatch && posterMatch;
  });

  const activeFiltersCount = [
    selectedNeighborhood !== 'all',
    selectedType !== 'all',
    selectedPoster !== 'all',
    !!selectedDay,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedNeighborhood('all');
    setSelectedType('all');
    setSelectedPoster('all');
    setSelectedDay(null);
  };

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-10 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#d4580a' }}>Calendar</h1>
            <p className="text-muted-foreground text-sm">Events from local businesses, organizations & communities</p>
          </div>
          {user && (
            <Link to="/create-event" className="flex-shrink-0 ml-4">
              <Button variant="outline" className="gap-2 rounded-lg" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
                <Plus className="w-4 h-4" /> Create Event
              </Button>
            </Link>
          )}
        </div>
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Organizer Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {POSTER_TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setSelectedPoster(value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
              ${selectedPoster === value ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0 space-y-4">
          <MiniCalendar
            currentMonth={currentMonth}
            events={upcomingEvents}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onPrevMonth={() => setCurrentMonth(m => subMonths(m, 1))}
            onNextMonth={() => setCurrentMonth(m => addMonths(m, 1))}
          />

          {/* Neighborhood Filter */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm text-foreground">Neighborhood</h3>
            </div>
            <select
              value={selectedNeighborhood}
              onChange={e => setSelectedNeighborhood(e.target.value)}
              className="w-full text-sm border border-input rounded-lg px-3 py-2 bg-transparent text-foreground outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="all">All Neighborhoods</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>

          {/* Event Type Filter */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm text-foreground">Event Type</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedType(value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all
                    ${selectedType === value ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''}
            </button>
          )}
        </aside>

        {/* Events List */}
        <div className="flex-1 min-w-0">
          {/* For You Section */}
          {user && <ForYouSection user={user} />}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'Upcoming Events'}
              </span>
              <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <Calendar className="w-12 h-12 mx-auto text-accent/30 mb-3" />
              <p className="font-semibold text-foreground mb-1">No events found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or check back later.</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {filtered.map(event => <EventCard key={event.id} event={event} compact />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}