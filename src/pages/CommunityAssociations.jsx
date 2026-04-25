import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Shield, Users, MapPin, CheckCircle, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

export default function CommunityAssociations() {
  const [search, setSearch] = useState('');

  const { data: associations = [], isLoading } = useQuery({
    queryKey: ['community-associations'],
    queryFn: () => base44.entities.CommunityAssociation.list('-created_date', 50),
  });

  const filtered = associations.filter(a =>
    !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.neighborhood_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Neighborhood Associations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Official community governance hubs</p>
        </div>
        <Link to="/create-community-association">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-lg">
            <Plus className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search associations or neighborhoods..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="rounded-xl"
      />

      {isLoading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No associations found</h3>
          <p className="text-sm text-muted-foreground">Start your neighborhood's official digital hub.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(assoc => (
            <Link key={assoc.id} to={`/community-associations/${assoc.id}`} className="flex gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="w-16 h-16 rounded-xl flex-shrink-0">
                <AvatarImage src={assoc.image_url} />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xl">{assoc.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{assoc.name}</h3>
                  {assoc.is_official && <Badge className="bg-primary/10 text-primary border-0 text-[10px]"><Shield className="w-2.5 h-2.5 mr-0.5" />Official</Badge>}
                  {assoc.is_verified && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                </div>
                {assoc.tagline && <p className="text-xs text-accent mt-0.5">{assoc.tagline}</p>}
                {assoc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{assoc.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{assoc.members_count || 0} members</span>
                  {assoc.neighborhood_name && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{assoc.neighborhood_name}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}