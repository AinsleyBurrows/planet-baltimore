import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Building2, MapPin, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const categories = ['All', 'Restaurant', 'Retail', 'Service', 'Entertainment', 'Health', 'Creative', 'Nonprofit'];

export default function Businesses() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => base44.entities.BusinessPage.list('-created_date', 50),
  });

  const filtered = activeCategory === 'All' ? businesses : businesses.filter(b => b.category === activeCategory.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Businesses</h1>
        <Link to="/create-business">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg">
            <Plus className="w-4 h-4" />Create Business
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No businesses yet</h3>
          <p className="text-sm text-muted-foreground">List your business and connect with the community!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((biz) => (
            <Link key={biz.id} to={`/businesses/${biz.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-sm transition-all group">
              <div className="h-24 bg-muted overflow-hidden">
                {biz.banner_url ? (
                  <img src={biz.banner_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary/10 to-accent/10" />
                )}
              </div>
              <div className="p-4 -mt-8">
                <Avatar className="w-14 h-14 border-4 border-card rounded-xl">
                  <AvatarImage src={biz.image_url} />
                  <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold">{biz.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="mt-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">{biz.name}</h3>
                    {biz.is_verified && <Shield className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{biz.category?.replace('_', ' ')}</p>
                  {biz.neighborhood_name && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{biz.neighborhood_name}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}