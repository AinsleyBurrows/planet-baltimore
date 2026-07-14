import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { Store, Search, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const MARKER_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-';
const vendorIcon = new L.Icon({
  iconUrl: `${MARKER_BASE}orange.png`,
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
const eventIcon = new L.Icon({
  iconUrl: `${MARKER_BASE}red.png`,
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BALTIMORE_CENTER = [39.2904, -76.6122];

export default function FestivalVendorMap() {
  const [search, setSearch] = useState('');

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ['festival-vendors'],
    queryFn: () => base44.entities.BusinessPage.list('-created_date', 100),
  });

  const { data: festivals = [] } = useQuery({
    queryKey: ['festival-map-events'],
    queryFn: () => base44.entities.Event.filter({ category: 'festival' }, 'date', 20),
  });

  const pinnableVendors = useMemo(
    () => vendors.filter(v => v.latitude && v.longitude && !v.is_muted),
    [vendors]
  );
  const pinnableFestivals = useMemo(
    () => festivals.filter(f => f.latitude && f.longitude),
    [festivals]
  );

  const filteredVendors = pinnableVendors.filter(v =>
    !search || v.name?.toLowerCase().includes(search.toLowerCase()) || v.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingVendors) {
    return <Skeleton className="h-[400px] rounded-2xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors by name or category…"
          className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden h-[400px] sm:h-[480px]">
          <MapContainer
            center={BALTIMORE_CENTER}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {pinnableFestivals.map(f => (
              <Marker key={f.id} position={[f.latitude, f.longitude]} icon={eventIcon}>
                <Popup>
                  <div className="min-w-[160px]">
                    <p className="font-semibold text-sm">{f.title}</p>
                    {f.venue_name && <p className="text-xs text-gray-500 mt-0.5">{f.venue_name}</p>}
                    {f.date && <p className="text-xs text-gray-500">{new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
                    <a href={`/events/${f.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">View festival →</a>
                  </div>
                </Popup>
              </Marker>
            ))}
            {filteredVendors.map(v => (
              <Marker key={v.id} position={[v.latitude, v.longitude]} icon={vendorIcon}>
                <Popup>
                  <div className="min-w-[160px]">
                    <p className="font-semibold text-sm">{v.name}</p>
                    {v.category && <p className="text-xs text-gray-500 capitalize mt-0.5">{v.category.replace('_', ' ')}</p>}
                    {v.address && <p className="text-xs text-gray-500 mt-0.5">{v.address}</p>}
                    <a href={`/businesses/${v.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">Visit vendor →</a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Vendor list */}
        <div className="space-y-2 max-h-[480px] overflow-y-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Store className="w-4 h-4 text-accent" />
            <span>{filteredVendors.length} vendors & vendors on map</span>
          </div>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No vendors found.</div>
          ) : (
            filteredVendors.slice(0, 30).map(v => (
              <Link
                key={v.id}
                to={`/businesses/${v.id}`}
                className="flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-accent" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm line-clamp-1">{v.name}</p>
                  {v.neighborhood_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {v.neighborhood_name}
                    </p>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Festival sites
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500" /> Vendors & businesses
        </span>
      </div>
    </div>
  );
}