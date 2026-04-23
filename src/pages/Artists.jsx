import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Palette, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const categories = ['All', 'Visual Art', 'Music', 'Video', 'Photography', 'Performance', 'Literary', 'Digital'];

export default function Artists() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { data: artists = [], isLoading } = useQuery({
    queryKey: ['artists'],
    queryFn: () => base44.entities.ArtistPage.list('-created_date', 50),
  });

  const filtered = activeCategory === 'All' ? artists : artists.filter(a => a.category === activeCategory.toLowerCase().replace(' ', '_'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Artists</h1>
        <Link to="/create-artist">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg">
            <Plus className="w-4 h-4" />Create Artist Page
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Palette className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No artists yet</h3>
          <p className="text-sm text-muted-foreground">Create your artist page and share your work!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((artist) => (
            <Link key={artist.id} to={`/artists/${artist.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all group">
              <div className="aspect-square bg-muted overflow-hidden">
                {artist.image_url ? (
                  <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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