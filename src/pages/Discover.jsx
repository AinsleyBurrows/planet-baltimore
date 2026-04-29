import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, MapPin, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EventCard from '@/components/shared/EventCard';
import StoryCard from '@/components/shared/StoryCard';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const categories = ['All', 'Events', 'Artists', 'Communities', 'Businesses', 'Your Story', 'Neighborhoods'];

export default function Discover() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: events = [] } = useQuery({ queryKey: ['discover-events'], queryFn: () => base44.entities.Event.list('-created_date', 6), staleTime: 180000 });
  const { data: artists = [] } = useQuery({ queryKey: ['discover-artists'], queryFn: () => base44.entities.ArtistPage.list('-created_date', 6), staleTime: 180000 });
  const { data: stories = [] } = useQuery({ queryKey: ['discover-stories'], queryFn: () => base44.entities.Story.filter({ status: 'published' }, '-created_date', 4), staleTime: 180000 });

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 p-8 sm:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">Discover Baltimore</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Find events, artists, communities, and stories across the city.</p>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events, artists, businesses..." className="pl-10 h-11 rounded-xl bg-secondary border-0" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === cat ? 'bg-foreground text-background shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Events */}
      {(activeCategory === 'All' || activeCategory === 'Events') && events.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" />Trending Events</h2>
            <Link to="/events" className="text-sm text-accent font-medium">See all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.slice(0, 4).map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </section>
      )}

      {/* Featured Artists */}
      {(activeCategory === 'All' || activeCategory === 'Artists') && artists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" />Artists to Follow</h2>
            <Link to="/artists" className="text-sm text-accent font-medium">See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {artists.slice(0, 6).map((artist) => (
              <Link key={artist.id} to={`/artists/${artist.id}`} className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={artist.image_url} />
                  <AvatarFallback className="bg-accent/10 text-accent font-bold">{artist.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">{artist.name}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{artist.category?.replace('_', ' ')}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stories */}
      {(activeCategory === 'All' || activeCategory === 'Your Story') && stories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Latest Stories</h2>
            <Link to="/stories" className="text-sm text-accent font-medium">See all</Link>
          </div>
          <div className="space-y-3">
            {stories.slice(0, 3).map((story) => <StoryCard key={story.id} story={story} />)}
          </div>
        </section>
      )}

      {/* Empty State */}
      {events.length === 0 && artists.length === 0 && stories.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Discover what Baltimore has to offer</h3>
          <p className="text-sm text-muted-foreground">Events, artists, and stories are being added every day.</p>
        </div>
      )}
    </div>
  );
}