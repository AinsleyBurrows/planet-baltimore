import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AGENCY_TYPE_LABELS = {
  mayor_office: "Mayor's Office", city_council: 'City Council', department: 'Department',
  commission: 'Commission', agency: 'Agency', office: 'Office', court: 'Court', other: 'Government Entity',
};

export default function GovernmentAgencies() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ['government-agencies'],
    queryFn: () => base44.entities.GovernmentAgency.list('-created_date', 100),
  });

  const filtered = agencies.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.agency_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Government Agencies</h1>
          <p className="text-sm text-muted-foreground mt-1">City departments, offices, and official entities</p>
        </div>
        <Link to="/create-government-agency">
          <Button className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-4 h-4" /> Create Agency</Button>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Search agencies…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          {Object.entries(AGENCY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No agencies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <Link key={a.id} to={`/government-agencies/${a.id}`} className="bg-card border border-border rounded-xl p-4 interactive-card flex gap-3">
              <Avatar className="w-14 h-14 rounded-xl flex-shrink-0">
                <AvatarImage src={a.image_url} className="object-cover rounded-xl" />
                <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-xl font-bold">{a.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{a.name}</p>
                <Badge className="mt-1 bg-accent/10 text-accent border-0 text-[10px]">{AGENCY_TYPE_LABELS[a.agency_type] || a.agency_type}</Badge>
                {a.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{a.description}</p>}
                {a.neighborhood_name && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {a.neighborhood_name}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}