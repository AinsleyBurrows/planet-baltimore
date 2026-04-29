import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Users, Shield, Search, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const categories = ['All', 'Neighborhood', 'Arts', 'Activism', 'Wellness', 'Education', 'Social', 'Civic'];
const SORTS = [
  { value: '-created_date', label: 'Newest' },
  { value: '-members_count', label: 'Most Members' },
];

export default function Communities() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort] = useState('-created_date');
  const [search, setSearch] = useState('');

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ['communities', sort],
    queryFn: () => base44.entities.Community.list(sort, 80),
  });

  const filtered = communities.filter(c => {
    const catMatch = activeCategory === 'All' || c.category === activeCategory.toLowerCase();
    const searchMatch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.neighborhood_name?.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 p-8 sm:p-12">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">Groups / Communities</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Find your people and build something together in Baltimore.</p>
          </div>
          <Link to="/create-community" className="flex-shrink-0 ml-4">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Link to Associations */}
      <Link to="/community-associations" className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Building className="w-4 h-4 text-primary" /></div>
        <div>
          <p className="text-sm font-semibold text-primary">Neighborhood Associations</p>
          <p className="text-xs text-muted-foreground">Official governance hubs for your neighborhood</p>
        </div>
      </Link>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl" placeholder="Search communities..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-border rounded-xl px-3 bg-card text-foreground outline-none cursor-pointer">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === cat ? 'bg-foreground text-background shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}>
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
            <Link key={community.id} to={`/communities/${community.id}`} className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
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