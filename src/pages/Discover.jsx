import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Sparkles, MapPin, TrendingUp, Users, Building2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EventCard from '@/components/shared/EventCard';
import StoryCard from '@/components/shared/StoryCard';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const categories = ['All', 'Events', 'Artists', 'Communities', 'Businesses', 'Stories', 'Neighborhoods'];

export default function Discover() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: events = [] } = useQuery({ queryKey: ['discover-events'], queryFn: () => base44.entities.Event.list('-created_date', 20), staleTime: 180000 });
  const { data: artists = [] } = useQuery({ queryKey: ['discover-artists'], queryFn: () => base44.entities.ArtistPage.list('-created_date', 20), staleTime: 180000 });
  const { data: stories = [] } = useQuery({ queryKey: ['discover-stories'], queryFn: () => base44.entities.Story.filter({ status: 'published' }, '-created_date', 20), staleTime: 180000 });
  const { data: communities = [] } = useQuery({ queryKey: ['discover-communities'], queryFn: () => base44.entities.Community.list('-created_date', 20), staleTime: 180000 });
  const { data: businesses = [] } = useQuery({ queryKey: ['discover-businesses'], queryFn: () => base44.entities.BusinessPage.list('-created_date', 20), staleTime: 180000 });
  const { data: neighborhoods = [] } = useQuery({ queryKey: ['discover-neighborhoods'], queryFn: () => base44.entities.Neighborhood.list('name', 50), staleTime: 180000 });

  const q = search.toLowerCase();
  const filteredEvents = events.filter(e => !q || e.title?.toLowerCase().includes(q) || e.venue_name?.toLowerCase().includes(q) || e.neighborhood_name?.toLowerCase().includes(q));
  const filteredArtists = artists.filter(a => !q || a.name?.toLowerCase().includes(q) || a.bio?.toLowerCase().includes(q));
  const filteredStories = stories.filter(s => !q || s.title?.toLowerCase().includes(q) || s.author_name?.toLowerCase().includes(q));
  const filteredCommunities = communities.filter(c => !q || c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q) || c.neighborhood_name?.toLowerCase().includes(q));
  const filteredBusinesses = businesses.filter(b => !q || b.name?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q) || b.neighborhood_name?.toLowerCase().includes(q));
  const filteredNeighborhoods = neighborhoods.filter(n => !q || n.name?.toLowerCase().includes(q) || n.region?.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q));

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#d4580a' }}>Discover Baltimore</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Find events, artists, communities, and stories across the city.</p>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
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
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === cat ? 'bg-[#d4580a] text-white shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Events */}
      {(activeCategory === 'All' || activeCategory === 'Events') && filteredEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-accent" />Trending Events</h2>
            <Link to="/ticketing" className="text-sm font-medium" style={{ color: '#d4580a' }}>See all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredEvents.slice(0, 4).map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </section>
      )}

      {/* Featured Artists */}
      {(activeCategory === 'All' || activeCategory === 'Artists') && filteredArtists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" />Artists to Follow</h2>
            <Link to="/artists" className="text-sm text-accent font-medium">See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredArtists.slice(0, 6).map((artist) => (
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

      {/* Communities */}
      {(activeCategory === 'All' || activeCategory === 'Communities') && filteredCommunities.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-accent" />Communities</h2>
            <Link to="/communities" className="text-sm font-medium" style={{ color: '#d4580a' }}>See all</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCommunities.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/communities/${c.id}`} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200">
                <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                  <AvatarImage src={c.image_url} className="rounded-xl" />
                  <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold">{c.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.neighborhood_name || c.category}</p>
                  {c.members_count > 0 && <p className="text-xs text-muted-foreground">{c.members_count} members</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Businesses */}
      {(activeCategory === 'All' || activeCategory === 'Businesses') && filteredBusinesses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-accent" />Businesses</h2>
            <Link to="/businesses" className="text-sm font-medium" style={{ color: '#d4580a' }}>See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredBusinesses.slice(0, 6).map((b) => (
              <Link key={b.id} to={`/businesses/${b.id}`} className="bg-card border border-border rounded-xl p-4 text-center hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 group">
                <Avatar className="w-14 h-14 mx-auto mb-2 rounded-xl">
                  <AvatarImage src={b.image_url} className="rounded-xl" />
                  <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold">{b.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">{b.name}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{b.category?.replace('_', ' ')}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stories */}
      {(activeCategory === 'All' || activeCategory === 'Stories') && filteredStories.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Latest Stories</h2>
            <Link to="/stories" className="text-sm text-accent font-medium">See all</Link>
          </div>
          <div className="space-y-3">
            {filteredStories.slice(0, 3).map((story) => <StoryCard key={story.id} story={story} />)}
          </div>
        </section>
      )}

      {/* Neighborhoods */}
      {(activeCategory === 'All' || activeCategory === 'Neighborhoods') && filteredNeighborhoods.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-accent" />Neighborhoods</h2>
            <Link to="/neighborhoods" className="text-sm font-medium" style={{ color: '#d4580a' }}>See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredNeighborhoods.slice(0, 9).map((n) => (
              <Link key={n.id} to={`/neighborhoods`} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 group">
                {n.image_url
                  ? <img src={n.image_url} alt={n.name} className="w-full h-20 object-cover" />
                  : <div className="w-full h-20 bg-accent/10 flex items-center justify-center"><MapPin className="w-6 h-6 text-accent" /></div>
                }
                <div className="p-2">
                  <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">{n.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{n.region}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && filteredArtists.length === 0 && filteredStories.length === 0 && filteredCommunities.length === 0 && filteredBusinesses.length === 0 && filteredNeighborhoods.length === 0 && (
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