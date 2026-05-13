import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Palette, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const categories = ['All', 'Visual Art', 'Music', 'Video', 'Photography', 'Performance', 'Literary', 'Digital'];

const SORTS = [
  { value: '-created_date', label: 'Newest' },
  { value: '-followers_count', label: 'Most Followed' },
];

export default function Artists() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort] = useState('-created_date');
  const [search, setSearch] = useState('');

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['artists', sort],
    queryFn: () => base44.entities.ArtistPage.list(sort, 80),
    staleTime: 120000,
  });

  const filtered = artists.filter(a => {
    const catMatch = activeCategory === 'All' || a.category === activeCategory.toLowerCase().replace(' ', '_');
    const searchMatch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.neighborhood_name?.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="space-y-0">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12" style={{ backgroundColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">Artists</h1>
            <p className="text-white/80 text-sm sm:text-base">Discover Baltimore's creative voices — visual art, music, photography & more.</p>
          </div>
          <Link to="/create-artist" className="flex-shrink-0 ml-4">
            <Button className="text-foreground gap-2 rounded-lg" style={{ backgroundColor: '#f4a460' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Artist Page</span>
            </Button>
          </Link>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Search + sort */}

      <div className="flex gap-2" style={{ marginTop: '74px' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl" placeholder="Search artists..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-border rounded-xl px-3 bg-card text-foreground outline-none cursor-pointer">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mt-6">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === cat ? 'bg-[#d4580a] text-white shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}>
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 mt-6">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Palette className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No artists yet</h3>
          <p className="text-sm text-muted-foreground">Create your artist page and share your work!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          {filtered.map((artist) => (
            <Link key={artist.id} to={`/artists/${artist.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="aspect-square bg-muted overflow-hidden">
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
                    <Palette className="w-10 h-10 text-accent/30" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">{artist.name}</h3>
                  {artist.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{artist.category?.replace('_', ' ')}</p>
                {artist.neighborhood_name && <p className="text-xs text-muted-foreground mt-0.5">{artist.neighborhood_name}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}