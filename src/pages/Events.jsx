import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Calendar, LayoutList, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import CalendarView from '@/components/events/CalendarView';
import CreateEventModal from '@/components/events/CreateEventModal';

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
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Events</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 sm:p-2 transition-colors ${viewMode === 'list' ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
            >
              <LayoutList className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 sm:p-2 transition-colors ${viewMode === 'calendar' ? 'bg-foreground text-background' : 'bg-card text-muted-foreground hover:bg-secondary'}`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1 sm:gap-1.5 rounded-lg p-2 sm:px-3">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Arts org filter strip */}
      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-secondary/40 rounded-xl overflow-x-auto">
        <Building2 className="w-4 h-4 text-accent flex-shrink-0" />
        <div className="flex gap-1.5 sm:gap-2">
          {ARTS_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setArtsFilter(type)}
              className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
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
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 sm:-mx-4 px-3 sm:px-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
              <Skeleton className="aspect-[16/9]" />
              <div className="p-3 sm:p-4 space-y-2">
                <Skeleton className="h-4 w-20" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
          <CalendarView events={filtered} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <Calendar className="w-7 h-7 sm:w-9 sm:h-9 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">No events found</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Be the first to create an event!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}

      <CreateEventModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}