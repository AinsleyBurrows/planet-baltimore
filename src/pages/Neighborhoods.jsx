import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, Users, Calendar, Building2, X, Palette, Landmark, Shield as ShieldIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/shared/EventCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import NeighborhoodMap from '@/components/neighborhoods/NeighborhoodMap';

export default function Neighborhoods() {
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const mapRef = useRef(null);

  const handleSelect = (n) => {
    setSelected(n);
    // Scroll the map into view so the user sees the pin
    setTimeout(() => {
      mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const { data: neighborhoods = [], isLoading: loadingNeighborhoods } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => base44.entities.Neighborhood.list('name', 500),
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['neighborhood-events', selected?.name],
    queryFn: () => base44.entities.Event.filter({ neighborhood_name: selected.name }, '-date', 12),
    enabled: !!selected,
  });

  const { data: businesses = [], isLoading: loadingBusinesses } = useQuery({
    queryKey: ['neighborhood-businesses', selected?.name],
    queryFn: () => base44.entities.BusinessPage.filter({ neighborhood_name: selected.name }, '-created_date', 12),
    enabled: !!selected,
  });

  const { data: communities = [], isLoading: loadingCommunities } = useQuery({
    queryKey: ['neighborhood-communities', selected?.name],
    queryFn: () => base44.entities.Community.filter({ neighborhood_name: selected.name }, '-created_date', 12),
    enabled: !!selected,
  });

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['neighborhood-artists', selected?.name],
    queryFn: () => base44.entities.ArtistPage.filter({ neighborhood_name: selected.name }, '-created_date', 12),
    enabled: !!selected,
  });

  const { data: artsOrgs = [], isLoading: loadingArtsOrgs } = useQuery({
    queryKey: ['neighborhood-arts-orgs', selected?.name],
    queryFn: () => base44.entities.ArtsOrganization.filter({ neighborhood_name: selected.name }, '-created_date', 12),
    enabled: !!selected,
  });

  const { data: associations = [], isLoading: loadingAssociations } = useQuery({
    queryKey: ['neighborhood-associations', selected?.name],
    queryFn: () => base44.entities.CommunityAssociation.filter({ neighborhood_name: selected.name }, '-created_date', 12),
    enabled: !!selected,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Neighborhoods</h1>
        <p className="text-sm text-muted-foreground mt-1">Explore Baltimore's communities — click a pin to discover what's happening nearby.</p>
      </div>

      {/* Map */}
      <div ref={mapRef} className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 420 }}>
        {loadingNeighborhoods ? (
          <Skeleton className="w-full h-full rounded-none" />
        ) : (
          <NeighborhoodMap
            neighborhoods={neighborhoods}
            selected={selected}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Selected neighborhood panel */}
      {selected ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              {selected.image_url ? (
                <img src={selected.image_url} alt={selected.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
                <Badge variant="secondary" className="text-xs mb-1">{selected.region}</Badge>
                {selected.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selected.description}</p>}
                {selected.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selected.tags.map((tag, i) => <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>)}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors flex-shrink-0" aria-label="Close">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Filtered content tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-secondary/50 rounded-xl flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="events" className="flex-1 rounded-lg gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5" />Events
              </TabsTrigger>
              <TabsTrigger value="businesses" className="flex-1 rounded-lg gap-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5" />Businesses
              </TabsTrigger>
              <TabsTrigger value="communities" className="flex-1 rounded-lg gap-1.5 text-xs">
                <Users className="w-3.5 h-3.5" />Communities
              </TabsTrigger>
              <TabsTrigger value="artists" className="flex-1 rounded-lg gap-1.5 text-xs">
                <Palette className="w-3.5 h-3.5" />Artists
              </TabsTrigger>
              <TabsTrigger value="arts-orgs" className="flex-1 rounded-lg gap-1.5 text-xs">
                <Landmark className="w-3.5 h-3.5" />Arts Orgs
              </TabsTrigger>
              <TabsTrigger value="associations" className="flex-1 rounded-lg gap-1.5 text-xs">
                <ShieldIcon className="w-3.5 h-3.5" />Associations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="events" className="mt-4 space-y-3">
              {loadingEvents ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
              ) : events.length === 0 ? (
                <EmptyState icon={Calendar} label="No upcoming events in this neighborhood" />
              ) : (
                events.map(event => <EventCard key={event.id} event={event} compact />)
              )}
            </TabsContent>

            <TabsContent value="businesses" className="mt-4 space-y-3">
              {loadingBusinesses ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              ) : businesses.length === 0 ? (
                <EmptyState icon={Building2} label="No businesses listed in this neighborhood" />
              ) : (
                businesses.map(biz => (
                  <Link key={biz.id} to={`/businesses/${biz.id}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all group">
                    <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                      <AvatarImage src={biz.image_url} />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{biz.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">{biz.name}</p>
                        {biz.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{biz.category?.replace('_', ' ')}</p>
                      {biz.hours && <p className="text-xs text-muted-foreground">{biz.hours}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{(biz.followers_count || 0).toLocaleString()} followers</span>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="communities" className="mt-4 space-y-3">
              {loadingCommunities ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              ) : communities.length === 0 ? (
                <EmptyState icon={Users} label="No communities in this neighborhood yet" />
              ) : (
                communities.map(com => (
                  <Link key={com.id} to={`/communities/${com.id}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all group">
                    <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                      <AvatarImage src={com.image_url} />
                      <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold">{com.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">{com.name}</p>
                        {com.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{com.category}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{(com.members_count || 0).toLocaleString()} members</span>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="artists" className="mt-4 space-y-3">
              {loadingArtists ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              ) : artists.length === 0 ? (
                <EmptyState icon={Palette} label="No artists listed in this neighborhood yet" />
              ) : (
                artists.map(artist => (
                  <Link key={artist.id} to={`/artists/${artist.id}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all group">
                    <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                      <AvatarImage src={artist.image_url} />
                      <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold">{artist.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">{artist.name}</p>
                        {artist.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{artist.category?.replace('_', ' ')}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{(artist.followers_count || 0).toLocaleString()} followers</span>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="arts-orgs" className="mt-4 space-y-3">
              {loadingArtsOrgs ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              ) : artsOrgs.length === 0 ? (
                <EmptyState icon={Landmark} label="No arts organizations in this neighborhood yet" />
              ) : (
                artsOrgs.map(org => (
                  <Link key={org.id} to={`/arts-organizations/${org.id}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all group">
                    <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                      <AvatarImage src={org.image_url} />
                      <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold">{org.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">{org.name}</p>
                        {org.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">{org.org_type?.replace('_', ' ')}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{(org.followers_count || 0).toLocaleString()} followers</span>
                  </Link>
                ))
              )}
            </TabsContent>

            <TabsContent value="associations" className="mt-4 space-y-3">
              {loadingAssociations ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              ) : associations.length === 0 ? (
                <EmptyState icon={ShieldIcon} label="No community associations in this neighborhood yet" />
              ) : (
                associations.map(assoc => (
                  <Link key={assoc.id} to={`/community-associations/${assoc.id}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all group">
                    <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                      <AvatarImage src={assoc.image_url} />
                      <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{assoc.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">{assoc.name}</p>
                        {assoc.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                      </div>
                      {assoc.tagline && <p className="text-xs text-muted-foreground truncate">{assoc.tagline}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{(assoc.members_count || 0).toLocaleString()} members</span>
                  </Link>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* Neighborhood grid when nothing selected */
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Neighborhoods</h2>
          {loadingNeighborhoods ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array(9).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {neighborhoods.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleSelect(n)}
                  className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl hover:border-accent/50 hover:shadow-sm transition-all text-left group"
                >
                  <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">{n.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{n.region}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}