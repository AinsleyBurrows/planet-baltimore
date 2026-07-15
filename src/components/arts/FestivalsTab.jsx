import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Sparkles, Palette, Landmark, Shield, MapPin } from 'lucide-react';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function FestivalsTab() {
  const [section, setSection] = useState('festivals');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['festivals'],
    queryFn: () => base44.entities.Event.filter({ category: 'festival' }, 'date', 100),
    staleTime: 120000,
  });

  const now = new Date();
  const filtered = events.filter(e => {
    const ended = (e.end_date ? new Date(e.end_date) : new Date(e.date)) < now;
    return !ended && (!search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-secondary/60 rounded-xl w-fit">
        <button
          onClick={() => setSection('festivals')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${section === 'festivals' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Festivals
        </button>
        <button
          onClick={() => setSection('scout')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${section === 'scout' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Scout Art Fair
        </button>
      </div>

      {section === 'scout' ? (
        <ScoutArtFair />
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search festivals..."
              className="pl-9 rounded-xl bg-secondary/50 border-0"
            />
          </div>

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
              <p className="text-sm text-muted-foreground">Create a festival event to feature it here.</p>
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

function ScoutArtFair() {
  const [picker, setPicker] = useState('artists');

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['scout-artists'],
    queryFn: () => base44.entities.ArtistPage.list('-created_date', 100),
    enabled: picker === 'artists',
    staleTime: 120000,
  });

  const { data: galleries = [], isLoading: loadingGalleries } = useQuery({
    queryKey: ['scout-galleries'],
    queryFn: () => base44.entities.ArtsOrganization.filter({ org_type: 'gallery' }, '-created_date', 100),
    enabled: picker === 'galleries',
    staleTime: 120000,
  });

  const isLoading = picker === 'artists' ? loadingArtists : loadingGalleries;
  const items = picker === 'artists' ? artists : galleries;

  return (
    <div className="space-y-5">
      {/* Picker */}
      <div className="flex gap-1 p-1 bg-secondary/60 rounded-xl w-fit">
        <button
          onClick={() => setPicker('artists')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${picker === 'artists' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Palette className="w-4 h-4" /> Artists
        </button>
        <button
          onClick={() => setPicker('galleries')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${picker === 'galleries' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Landmark className="w-4 h-4" /> Galleries
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            {picker === 'artists' ? <Palette className="w-7 h-7 text-accent" /> : <Landmark className="w-7 h-7 text-accent" />}
          </div>
          <h3 className="font-semibold text-foreground mb-1">No {picker} yet</h3>
          <p className="text-sm text-muted-foreground">Check back soon for Scout Art Fair participants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <ScoutCard key={item.id} item={item} type={picker} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScoutCard({ item, type }) {
  const link = type === 'artists' ? `/artists/${item.id}` : `/arts-organizations/${item.id}`;
  return (
    <Link
      to={link}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="p-4 flex items-start gap-3">
        <Avatar className="w-14 h-14 rounded-xl flex-shrink-0">
          <AvatarImage src={item.image_url} />
          <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold text-lg">{item.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">{item.name}</h3>
            {item.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
          </div>
          {type === 'artists' ? (
            <Badge variant="secondary" className="text-xs mt-0.5 capitalize">{item.category?.replace(/_/g, ' ')}</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs mt-0.5">Gallery</Badge>
          )}
          {item.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.bio}</p>}
          {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
          {item.neighborhood_name && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.neighborhood_name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}