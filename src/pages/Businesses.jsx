import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Building2, MapPin, Shield, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

const categories = ['All', 'Restaurant', 'Retail', 'Service', 'Entertainment', 'Health', 'Creative', 'Nonprofit'];
const SORTS = [
  { value: '-created_date', label: 'Newest' },
  { value: '-followers_count', label: 'Most Followed' },
];

export default function Businesses() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [sort, setSort] = useState('-created_date');
  const [search, setSearch] = useState('');

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ['businesses', sort],
    queryFn: () => base44.entities.BusinessPage.list(sort, 80),
    staleTime: 120000,
  });

  const filtered = businesses.filter(b => {
    const catMatch = activeCategory === 'All' || b.category === activeCategory.toLowerCase();
    const searchMatch = !search || b.name?.toLowerCase().includes(search.toLowerCase()) || b.neighborhood_name?.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#d4580a' }}>Businesses</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Discover and support local Baltimore businesses.</p>
          </div>
          <Link to="/create-business" className="flex-shrink-0 ml-4">
            <Button variant="outline" className="gap-2 rounded-lg" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Business Page</span>
            </Button>
          </Link>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 rounded-xl" placeholder="Search businesses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="text-sm border border-border rounded-xl px-3 bg-card text-foreground outline-none cursor-pointer">
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeCategory === cat ? 'bg-[#d4580a] text-white shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}>
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((biz) => (
            <Link key={biz.id} to={`/businesses/${biz.id}`} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="h-24 bg-muted overflow-hidden">
                {biz.banner_url ? (
                  <img src={biz.banner_url} alt="" loading="lazy" className="w-full h-full object-cover" />
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