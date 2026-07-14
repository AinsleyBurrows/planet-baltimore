import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Music, Users, Search, Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_ICONS = {
  music: Music,
  visual_art: Palette,
  photography: Palette,
  performance: Users,
  video: Palette,
  podcaster: Music,
};

export default function FestivalArtistGallery() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['festival-artists'],
    queryFn: () => base44.entities.ArtistPage.list('-followers_count', 100),
  });

  const categories = ['all', ...Array.from(new Set(artists.map(a => a.category).filter(Boolean)))];

  const filtered = artists.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.bio?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || a.category === category;
    return matchSearch && matchCat && !a.is_muted;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artists…"
            className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-all ${
                category === cat ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {cat === 'all' ? 'All' : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Artist grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <Music className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No artists found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(artist => {
            const Icon = CATEGORY_ICONS[artist.category] || Palette;
            return (
              <Link
                key={artist.id}
                to={`/artists/${artist.id}`}
                className="bg-card border border-border rounded-2xl overflow-hidden interactive-card group"
              >
                <div className="aspect-square overflow-hidden bg-muted relative">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  {artist.is_verified && (
                    <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-accent transition-colors">{artist.name}</h3>
                  {artist.category && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{artist.category.replace('_', ' ')}</p>
                  )}
                  {artist.neighborhood_name && (
                    <p className="text-xs text-muted-foreground mt-0.5">{artist.neighborhood_name}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}