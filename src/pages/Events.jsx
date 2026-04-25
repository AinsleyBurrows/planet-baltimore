import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Calendar, LayoutList, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import CalendarView from '@/components/events/CalendarView';

const CATEGORIES = ['All', 'Art', 'Music', 'Education', 'Community', 'Wellness', 'Festival', 'Family', 'Other'];
const ARTS_TYPES = ['All Events', 'Exhibitions', 'Workshops', 'Performances', 'Talks'];

// Maps arts org subcategory labels to event tags/categories
const ARTS_FILTER_MAP = {
  'Exhibitions': ['art'],
  'Workshops': ['education'],
  'Performances': ['music', 'performance'],
  'Talks': ['community', 'education'],
};

export default function Events() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [artsFilter, setArtsFilter] = useState('All Events');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('date', 100),
  });

  const { data: artsOrgs = [] } = useQuery({
    queryKey: ['arts-orgs-list'],
    queryFn: () => base44.entities.ArtsOrganization.list('-created_date', 20),
  });

  const artsOrgIds = new Set(artsOrgs.map(o => o.owner_id));

  const filtered = events.filter(e => {
    const catMatch = activeCategory === 'All' || e.category === activeCategory.toLowerCase();
    const artsMatch = artsFilter === 'All Events' || (() => {
      const allowedCats = ARTS_FILTER_MAP[artsFilter] || [];
      return allowedCats.includes(e.category) || (e.tags || []).some(t => allowedCats.includes(t));
    })();
    return catMatch && artsMatch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 transition-colors ${viewMode === 'calendar' ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
          <Link to="/create-event">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5 rounded-lg">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Arts org filter strip */}
      <div className="flex items-center gap-2 p-3 bg-secondary/40 rounded-xl">
        <Building2 className="w-4 h-4 text-accent flex-shrink-0" />
        <div className="flex gap-2 overflow-x-auto">
          {ARTS_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setArtsFilter(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                artsFilter === type
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card text-muted-foreground hover:bg-secondary border border-border'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <Skeleton className="aspect-[16/9]" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-card border border-border rounded-xl p-4">
          <CalendarView events={filtered} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No events found</h3>
          <p className="text-sm text-muted-foreground">Be the first to create an event!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}