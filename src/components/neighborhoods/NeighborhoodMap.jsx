import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SHADOW_URL = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const MARKER_BASE = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-';

// Region → marker color mapping
export const REGION_COLORS = {
  'North Baltimore':    { color: 'green',  hex: '#22c55e' },
  'South Baltimore':    { color: 'blue',   hex: '#3b82f6' },
  'East Baltimore':     { color: 'orange', hex: '#f97316' },
  'West Baltimore':     { color: 'violet', hex: '#8b5cf6' },
  'Central/Downtown':   { color: 'red',    hex: '#ef4444' },
};

function makeIcon(color, size = [25, 41]) {
  return new L.Icon({
    iconUrl: `${MARKER_BASE}${color}.png`,
    shadowUrl: SHADOW_URL,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

// Pre-build all icons
const REGION_ICONS = Object.fromEntries(
  Object.entries(REGION_COLORS).map(([region, { color }]) => [region, makeIcon(color)])
);

const selectedIcon = makeIcon('gold', [30, 49]);

function NeighborhoodMarker({ n, selected, onSelect }) {
  const markerRef = useRef(null);
  const isSelected = selected?.id === n.id;

  // Auto-open popup when this neighborhood is selected
  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[n.latitude, n.longitude]}
      icon={isSelected ? selectedIcon : (REGION_ICONS[n.region] || makeIcon('blue'))}
      eventHandlers={{ click: () => onSelect(n) }}
    >
      <Popup>
        <div className="min-w-[160px]">
          <p className="font-semibold text-sm">{n.name}</p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: REGION_COLORS[n.region]?.hex || '#6b7280' }}>{n.region}</p>
          {n.description && <p className="text-xs mt-1 text-gray-600 line-clamp-2">{n.description}</p>}
          {n.zip_codes?.length > 0 && (
            <p className="text-xs mt-1 text-gray-500">ZIP: {n.zip_codes.join(', ')}</p>
          )}
          <button
            onClick={() => onSelect(n)}
            className="mt-2 text-xs font-medium text-blue-600 hover:underline"
          >
            Explore neighborhood →
          </button>
        </div>
      </Popup>
    </Marker>
  );
}

function FlyToSelected({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected?.latitude && selected?.longitude) {
      map.flyTo([selected.latitude, selected.longitude], 14, { duration: 0.8 });
    }
  }, [selected, map]);
  return null;
}

const BALTIMORE_CENTER = [39.2904, -76.6122];

export default function NeighborhoodMap({ neighborhoods, selected, onSelect }) {
  const pinnable = neighborhoods.filter(n => n.latitude && n.longitude);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={BALTIMORE_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToSelected selected={selected} />

        {pinnable.map(n => (
          <NeighborhoodMarker
            key={n.id}
            n={n}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 space-y-1 border border-gray-200">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Region</p>
        {Object.entries(REGION_COLORS).map(([region, { hex }]) => (
          <div key={region} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
            <span className="text-[11px] text-gray-700 whitespace-nowrap">{region}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-200 mt-1">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#eab308' }} />
          <span className="text-[11px] text-gray-700 whitespace-nowrap">Selected</span>
        </div>
      </div>
    </div>
  );
}