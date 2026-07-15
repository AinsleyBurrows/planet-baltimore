import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Landmark, MapPin, Shield, Search, Filter, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import ArtsOrgMap from '@/components/arts/ArtsOrgMap';
import PlatformMessageModal from '@/components/admin/PlatformMessageModal';

const ORG_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'museum', label: 'Museum' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'studio_space', label: 'Studio Space' },
  { value: 'collective', label: 'Collective' },
  { value: 'residency', label: 'Residency' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'cultural_institution', label: 'Cultural' },
  { value: 'performance_space', label: 'Performance' },
  { value: 'community_art_space', label: 'Community' },
  { value: 'diy_space', label: 'DIY / Alt' },
  { value: 'art_school', label: 'Education' },
];

const ORG_TYPE_LABELS = Object.fromEntries(ORG_TYPES.map(t => [t.value, t.label]));

export default function ArtsOrganizations() {
  const [activeType, setActiveType] = useState('all');
  const [search, setSearch] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
  });

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['arts-orgs'],
    queryFn: () => base44.entities.ArtsOrganization.list('-created_date', 100),
    staleTime: 120000,
  });

  const filtered = orgs.filter(o => {
    const typeMatch = activeType === 'all' || o.org_type === activeType;
    const searchMatch = !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase());
    return typeMatch && searchMatch;
  });

  const featured = orgs.filter(o => o.is_featured).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#d4580a' }}>Arts Organizations</h1>
            <p className="text-muted-foreground text-sm sm:text-base">The living cultural map of Baltimore.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {currentUser?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMessageModal(true)}
                className="gap-1.5 rounded-lg hover:bg-secondary/80"
                style={{ borderColor: '#d4580a', color: '#d4580a' }}
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Message All</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(v => !v)}
              className="gap-1.5 rounded-lg hover:bg-secondary/80"
              style={{ borderColor: '#d4580a', color: '#d4580a' }}
            >
              <MapPin className="w-4 h-4" />{showMap ? 'List' : 'Map'}
            </Button>
            <Link to="/create-arts-org">
              <Button variant="outline" className="gap-2 rounded-lg hover:bg-secondary/80" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Arts Org Page</span>
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search arts organizations..."
          className="pl-9 rounded-xl bg-secondary/50 border-0"
        />
      </div>

      {/* Type filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {ORG_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setActiveType(t.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeType === t.value ? 'bg-[#d4580a] text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Map view */}
      {showMap && (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm" style={{ height: 380 }}>
          <ArtsOrgMap orgs={orgs.filter(o => o.latitude && o.longitude)} />
        </div>
      )}

      {/* Featured */}
      {!search && activeType === 'all' && featured.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Featured</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featured.map(org => (
              <OrgCard key={org.id} org={org} featured />
            ))}
          </div>
        </div>
      )}

      {/* All orgs */}
      <div>
        {(!search && activeType === 'all' && featured.length > 0) && (
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Organizations</h2>
        )}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Landmark className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No organizations found</h3>
            <p className="text-sm text-muted-foreground">Be the first to add a Baltimore arts organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(org => <OrgCard key={org.id} org={org} />)}
          </div>
        )}
      </div>
      <PlatformMessageModal open={showMessageModal} onClose={() => setShowMessageModal(false)} />
    </div>
  );
}

function OrgCard({ org, featured = false }) {
  return (
    <Link
      to={`/arts-organizations/${org.id}`}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {featured && org.banner_url && (
        <div className="h-28 overflow-hidden bg-muted">
          <img src={org.banner_url} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-4 flex items-start gap-3">
        <Avatar className={`${featured ? 'w-12 h-12' : 'w-14 h-14'} rounded-xl flex-shrink-0`}>
          <AvatarImage src={org.image_url} />
          <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold text-lg">{org.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">{org.name}</h3>
            {org.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
          </div>
          <Badge variant="secondary" className="text-xs mt-0.5 capitalize">
            {org.org_type?.replace(/_/g, ' ')}
          </Badge>
          {org.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{org.description}</p>}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {org.neighborhood_name && (
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{org.neighborhood_name}</span>
            )}
            <span>{(org.followers_count || 0).toLocaleString()} followers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}