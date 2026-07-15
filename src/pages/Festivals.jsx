import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Sparkles, Search, Plus, Calendar } from 'lucide-react';
import EventCard from '@/components/shared/EventCard';
import MainStageTab from '@/components/festivals/MainStageTab';
import OtherStagesTab from '@/components/festivals/OtherStagesTab';
import ArtFairTab from '@/components/festivals/ArtFairTab';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Festivals() {
  const [tab, setTab] = useState('festivals');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['festivals'],
    queryFn: () => base44.entities.Event.filter({ category: 'festival' }, 'date', 100),
    staleTime: 120000,
  });

  const now = new Date();
  const filtered = events.filter(e => {
    const ended = (e.end_date ? new Date(e.end_date) : new Date(e.date)) < now;
    if (ended) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return e.title?.toLowerCase().includes(q)
      || e.description?.toLowerCase().includes(q)
      || e.venue_name?.toLowerCase().includes(q)
      || e.neighborhood_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#d4580a' }}>Festivals</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Celebrate Baltimore — music, art, food, and culture all in one place.</p>
          </div>
          <Link to="/create-event" className="flex-shrink-0 ml-4">
            <Button variant="outline" className="gap-2 rounded-lg hover:bg-secondary/80" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Festival</span>
            </Button>
          </Link>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/60 rounded-xl w-fit">
        <button
          onClick={() => setTab('festivals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'festivals' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Festivals
        </button>
        <button
          onClick={() => setTab('main_stage')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'main_stage' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Main Stage
        </button>
        <button
          onClick={() => setTab('other_stages')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'other_stages' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Other Stages
        </button>
        <button
          onClick={() => setTab('art_fair')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'art_fair' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Art Fair
        </button>
      </div>

      {tab === 'main_stage' ? (
        <MainStageTab />
      ) : tab === 'other_stages' ? (
        <OtherStagesTab />
      ) : tab === 'art_fair' ? (
        <ArtFairTab />
      ) : (
      <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search festivals..."
          className="pl-9 rounded-xl bg-secondary/50 border-0"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No festivals yet</h3>
          <p className="text-sm text-muted-foreground">Create a festival event (category: Festival) to feature it here.</p>
          <Link to="/create-event" className="inline-block mt-4">
            <Button variant="outline" className="gap-2 rounded-lg" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
      </>
      )}
    </div>
  );
}