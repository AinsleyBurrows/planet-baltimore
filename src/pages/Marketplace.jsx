import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Plus, ShoppingBag, Music, Camera, Pencil, Film, Palette, FileText, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MarketplaceListingCard from '@/components/marketplace/MarketplaceListingCard';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'writing', label: 'Writing', icon: Pencil },
  { id: 'video', label: 'Video', icon: Film },
  { id: 'design', label: 'Design', icon: FileText },
  { id: 'other', label: 'Other', icon: Package },
];

export default function Marketplace() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['marketplace-listings'],
    queryFn: () => base44.entities.MarketplaceListing.filter({ is_active: true }, '-created_date', 100),
    staleTime: 30000,
  });

  const filtered = listings.filter((l) => {
    const matchCat = category === 'all' || l.category === category;
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">Buy & sell digital creations from Baltimore creators</p>
        </div>
        <Link to="/marketplace/sell">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <Plus className="w-4 h-4" /> Sell
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(({ id, label, icon: CategoryIcon }) => (
          <button
            key={id}
            onClick={() => setCategory(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
              category === id
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-card border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Listings grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No listings found</p>
          <p className="text-sm mt-1">Be the first to sell something!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <MarketplaceListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}