import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { base44 } from '@/api/base44Client';
import { Store, Search, MapPin, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_COLORS = {
  food: '#ef4444',
  art: '#8b5cf6',
  craft: '#f97316',
  merchandise: '#3b82f6',
  music: '#22c55e',
  kids: '#ec4899',
  info: '#64748b',
  bar: '#f59e0b',
  other: '#0ea5e9',
};

const SITE_ICON = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function boothIcon(boothNumber, category) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
  return L.divIcon({
    className: 'festival-booth-marker',
    html: `<div style="
      background:${color};
      width:34px;height:34px;border-radius:50% 50% 50% 4px;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:11px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;
      transform:rotate(-45deg);
    "><span style="transform:rotate(45deg)">${boothNumber}</span></div>`,
    iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -30],
  });
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useMemo(() => { if (center) map.flyTo(center, zoom || 16, { duration: 0.6 }); }, [center, zoom, map]);
  return null;
}

export default function FestivalVendorMap() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedFestivalId, setSelectedFestivalId] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  const { data: festivals = [], isLoading: loadingFestivals } = useQuery({
    queryKey: ['festival-map-events'],
    queryFn: () => base44.entities.Event.filter({ category: 'festival' }, 'date', 30),
  });

  const { data: booths = [], isLoading: loadingBooths } = useQuery({
    queryKey: ['festival-booths'],
    queryFn: () => base44.entities.FestivalBooth.list('-created_date', 500),
  });

  const festivalsWithLocation = festivals.filter(f => f.latitude && f.longitude);
  const selectedFestival = festivalsWithLocation.find(f => f.id === selectedFestivalId) || festivalsWithLocation[0];

  const festivalBooths = useMemo(
    () => booths.filter(b => b.event_id === selectedFestival?.id && b.latitude && b.longitude),
    [booths, selectedFestival]
  );

  const categories = ['all', ...Array.from(new Set(festivalBooths.map(b => b.category).filter(Boolean)))];

  const filteredBooths = festivalBooths.filter(b => {
    const matchSearch = !search || b.vendor_name?.toLowerCase().includes(search.toLowerCase()) || b.booth_number?.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || b.category === category;
    return matchSearch && matchCat;
  });

  const initialCenter = selectedFestival ? [selectedFestival.latitude, selectedFestival.longitude] : [39.2904, -76.6122];

  const selectFestival = (f) => {
    setSelectedFestivalId(f.id);
    setMapCenter([f.latitude, f.longitude]);
  };

  // Select first festival on load
  useEffect(() => {
    if (!selectedFestivalId && festivalsWithLocation.length > 0) {
      const first = festivalsWithLocation[0];
      setSelectedFestivalId(first.id);
      setMapCenter([first.latitude, first.longitude]);
    }
  }, [festivalsWithLocation, selectedFestivalId]);

  if (loadingFestivals) return <Skeleton className="h-[480px] rounded-2xl" />;

  return (
    <div className="space-y-4">
      {/* Festival selector */}
      {festivalsWithLocation.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-accent" /> Festival:
          </span>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {festivalsWithLocation.map(f => (
              <button
                key={f.id}
                onClick={() => selectFestival(f)}
                className={`px-3 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  selectedFestival?.id === f.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {f.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden h-[400px] sm:h-[500px]">
          {loadingBooths ? (
            <Skeleton className="h-full" />
          ) : (
            <MapContainer center={initialCenter} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {selectedFestival && (
                <Marker position={[selectedFestival.latitude, selectedFestival.longitude]} icon={SITE_ICON}>
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-sm">{selectedFestival.title}</p>
                      {selectedFestival.venue_name && <p className="text-xs text-gray-500 mt-0.5">{selectedFestival.venue_name}</p>}
                      <p className="text-xs text-gray-500">{festivalBooths.length} booths</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              {filteredBooths.map(booth => (
                <Marker key={booth.id} position={[booth.latitude, booth.longitude]} icon={boothIcon(booth.booth_number, booth.category)}>
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded text-white" style={{ background: CATEGORY_COLORS[booth.category] || CATEGORY_COLORS.other }}>
                          {booth.booth_number}
                        </span>
                        {booth.category && <span className="text-xs text-gray-500 capitalize">{booth.category}</span>}
                      </div>
                      <p className="font-semibold text-sm">{booth.vendor_name}</p>
                      {booth.description && <p className="text-xs text-gray-600 mt-1">{booth.description}</p>}
                      {booth.business_id && <a href={`/businesses/${booth.business_id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">Visit vendor page →</a>}
                    </div>
                  </Popup>
                </Marker>
              ))}
              {mapCenter && <FlyTo center={mapCenter} zoom={16} />}
            </MapContainer>
          )}
        </div>

        {/* Booth directory */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booths…"
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-card text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Category filter */}
          {categories.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap capitalize transition-all ${
                    category === cat ? 'text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                  style={category === cat ? { background: cat === 'all' ? '#0ea5e9' : (CATEGORY_COLORS[cat] || CATEGORY_COLORS.other) } : {}}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Store className="w-4 h-4 text-accent" />
            <span>{filteredBooths.length} booths</span>
          </div>

          {!selectedFestival ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No festival selected.</div>
          ) : filteredBooths.length === 0 ? (
            <div className="text-center py-8 bg-card border border-border rounded-xl text-sm text-muted-foreground">
              <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              No booths mapped for this festival yet.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBooths.map(booth => (
                <button
                  key={booth.id}
                  onClick={() => setMapCenter([booth.latitude, booth.longitude])}
                  className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-accent/30 transition-colors text-left"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ background: CATEGORY_COLORS[booth.category] || CATEGORY_COLORS.other }}
                  >
                    {booth.booth_number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm line-clamp-1">{booth.vendor_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {booth.category && <span className="text-xs text-muted-foreground capitalize">{booth.category}</span>}
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5"><MapPin className="w-3 h-3" />{booth.booth_number}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Festival site</span>
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="flex items-center gap-1.5 capitalize">
            <span className="w-3 h-3 rounded-full" style={{ background: color }} /> {cat}
          </span>
        ))}
      </div>
    </div>
  );
}