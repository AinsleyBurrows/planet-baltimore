import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Users, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const categories = ['All', 'Neighborhood', 'Arts', 'Activism', 'Wellness', 'Education', 'Social', 'Civic'];

export default function Communities() {
  const [activeCategory, setActiveCategory] = useState('All');
  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities'],
    queryFn: () => base44.entities.Community.list('-created_date', 50),
  });

  const filtered = activeCategory === 'All' ? communities : communities.filter(c => c.category === activeCategory.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Communities</h1>
        <Link to="/create-community">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg">
            <Plus className="w-4 h-4" />Create Community
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
            <Users className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No communities yet</h3>
          <p className="text-sm text-muted-foreground">Start a community and bring people together!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((community) => (
            <Link key={community.id} to={`/communities/${community.id}`} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-all group">
              <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 rounded-xl">
                  <AvatarImage src={community.image_url} />
                  <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold">{community.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">{community.name}</h3>
                    {community.is_verified && <Shield className="w-4 h-4 text-accent flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{community.category?.replace('_', ' ')}</p>
                  {community.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{community.description}</p>}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{community.members_count || 0} members</span>
                    {community.neighborhood_name && <><span>·</span><span>{community.neighborhood_name}</span></>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}