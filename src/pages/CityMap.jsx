import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CityMapView from '@/components/map/CityMapView';
import MapSidebar from '@/components/map/MapSidebar';
import MapFilterBar from '@/components/map/MapFilterBar';
import { Layers } from 'lucide-react';

export const LAYERS = {
  events:       { label: 'Events',       color: '#e85d3a', colorClass: 'bg-[#e85d3a]' },
  businesses:   { label: 'Businesses',   color: '#4c8bf5', colorClass: 'bg-[#4c8bf5]' },
  artists:      { label: 'Artists',      color: '#9b59b6', colorClass: 'bg-[#9b59b6]' },
  arts_orgs:    { label: 'Arts Orgs',    color: '#e67e22', colorClass: 'bg-[#e67e22]' },
  associations: { label: 'Associations', color: '#27ae60', colorClass: 'bg-[#27ae60]' },
};

export default function CityMap() {
  const [activeLayers, setActiveLayers] = useState(new Set(Object.keys(LAYERS)));
  const [selectedPin, setSelectedPin] = useState(null);
  const [search, setSearch] = useState('');

  const { data: events = [] } = useQuery({
    queryKey: ['map-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'upcoming' }, 'date', 200),
  });
  const { data: businesses = [] } = useQuery({
    queryKey: ['map-businesses'],
    queryFn: () => base44.entities.BusinessPage.list('-created_date', 200),
  });
  const { data: artists = [] } = useQuery({
    queryKey: ['map-artists'],
    queryFn: () => base44.entities.ArtistPage.list('-created_date', 200),
  });
  const { data: artsOrgs = [] } = useQuery({
    queryKey: ['map-arts-orgs'],
    queryFn: () => base44.entities.ArtsOrganization.list('-created_date', 200),
  });
  const { data: associations = [] } = useQuery({
    queryKey: ['map-associations'],
    queryFn: () => base44.entities.CommunityAssociation.list('-created_date', 200),
  });

  const allPins = useMemo(() => {
    const pins = [];

    if (activeLayers.has('events')) {
      events.filter(e => e.latitude && e.longitude).forEach(e => pins.push({
        id: `event-${e.id}`, type: 'events', raw: e,
        lat: e.latitude, lng: e.longitude,
        title: e.title, subtitle: e.category,
        image: e.image_url, link: `/events/${e.id}`,
        meta: e.venue_name || e.neighborhood_name,
      }));
    }
    if (activeLayers.has('businesses')) {
      businesses.filter(b => b.latitude && b.longitude).forEach(b => pins.push({
        id: `biz-${b.id}`, type: 'businesses', raw: b,
        lat: b.latitude, lng: b.longitude,
        title: b.name, subtitle: b.category,
        image: b.image_url, link: `/businesses/${b.id}`,
        meta: b.neighborhood_name,
      }));
    }
    if (activeLayers.has('artists')) {
      artists.filter(a => a.latitude && a.longitude).forEach(a => pins.push({
        id: `artist-${a.id}`, type: 'artists', raw: a,
        lat: a.latitude, lng: a.longitude,
        title: a.name, subtitle: a.category?.replace(/_/g, ' '),
        image: a.image_url, link: `/artists/${a.id}`,
        meta: a.neighborhood_name,
      }));
    }
    if (activeLayers.has('arts_orgs')) {
      artsOrgs.filter(o => o.latitude && o.longitude).forEach(o => pins.push({
        id: `org-${o.id}`, type: 'arts_orgs', raw: o,
        lat: o.latitude, lng: o.longitude,
        title: o.name, subtitle: o.org_type?.replace(/_/g, ' '),
        image: o.image_url, link: `/arts-organizations/${o.id}`,
        meta: o.neighborhood_name,
      }));
    }
    if (activeLayers.has('associations')) {
      associations.filter(a => a.latitude && a.longitude).forEach(a => pins.push({
        id: `assoc-${a.id}`, type: 'associations', raw: a,
        lat: a.latitude, lng: a.longitude,
        title: a.name, subtitle: 'Community Association',
        image: a.image_url, link: `/community-associations/${a.id}`,
        meta: a.neighborhood_name,
      }));
    }

    if (search) {
      const q = search.toLowerCase();
      return pins.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.subtitle?.toLowerCase().includes(q) ||
        p.meta?.toLowerCase().includes(q)
      );
    }

    return pins;
  }, [activeLayers, events, businesses, artists, artsOrgs, associations, search]);

  const toggleLayer = (key) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-4 -mb-4 sm:-mx-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" />
          <h1 className="text-lg font-bold text-foreground">Explore Baltimore</h1>
        </div>
        <span className="text-xs text-muted-foreground">{allPins.length} locations</span>
      </div>

      {/* Filter bar */}
      <MapFilterBar
        activeLayers={activeLayers}
        onToggleLayer={toggleLayer}
        search={search}
        onSearch={setSearch}
      />

      {/* Map + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <CityMapView
            pins={allPins}
            selectedPin={selectedPin}
            onSelectPin={setSelectedPin}
          />
        </div>
        {selectedPin && (
          <MapSidebar pin={selectedPin} onClose={() => setSelectedPin(null)} />
        )}
      </div>
    </div>
  );
}