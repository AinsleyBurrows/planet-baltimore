import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

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

// Approximate geographic centers for each region with soft fill colors
const REGION_ZONES = [
  { region: 'North Baltimore',   center: [39.3550, -76.6250], color: '#22c55e', radius: 3800 },
  { region: 'South Baltimore',   center: [39.2500, -76.5900], color: '#3b82f6', radius: 3200 },
  { region: 'East Baltimore',    center: [39.2950, -76.5600], color: '#f97316', radius: 3500 },
  { region: 'West Baltimore',    center: [39.2950, -76.6700], color: '#8b5cf6', radius: 3500 },
  { region: 'Central/Downtown',  center: [39.2904, -76.6122], color: '#ef4444', radius: 2200 },
];

const eventIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
  shadowUrl: SHADOW_URL,
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [41, 41],
});

function EventMarker({ event }) {
  if (!event.latitude || !event.longitude) return null;
  const dateStr = event.date ? format(new Date(event.date), 'MMM d, h:mm a') : null;

  return (
    <Marker position={[event.latitude, event.longitude]} icon={eventIcon}>
      <Popup>
        <div className="min-w-[200px] max-w-[240px]">
          {event.image_url && (
            <img src={event.image_url} alt={event.title} className="w-full h-24 object-cover rounded mb-2" />
          )}
          <p className="font-semibold text-sm leading-snug">{event.title}</p>
          {dateStr && <p className="text-xs text-gray-500 mt-0.5">📅 {dateStr}</p>}
          {event.venue_name && <p className="text-xs text-gray-500">📍 {event.venue_name}</p>}
          {event.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{event.description}</p>
          )}
          <a
            href={`/events/${event.id}`}
            className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
          >
            View event →
          </a>
        </div>
      </Popup>
    </Marker>
  );
}

export default function NeighborhoodMap({ neighborhoods, selected, onSelect, events = [] }) {
  const pinnable = neighborhoods.filter(n => n.latitude && n.longitude);
  const pinnableEvents = events.filter(e => e.latitude && e.longitude);

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

        {/* Soft region shading */}
        {REGION_ZONES.map(({ region, center, color, radius }) => (
          <Circle
            key={region}
            center={center}
            radius={radius}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.18, weight: 1, opacity: 0.35 }}
          />
        ))}

        <FlyToSelected selected={selected} />

        {pinnable.map(n => (
          <NeighborhoodMarker
            key={n.id}
            n={n}
            selected={selected}
            onSelect={onSelect}
          />
        ))}

        {/* Event markers */}
        {pinnableEvents.map(e => (
          <EventMarker key={e.id} event={e} />
        ))}
      </MapContainer>

      {/* Legend */}
      {pinnableEvents.length > 0 && (
        <div className="absolute bottom-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow text-xs flex items-center gap-1.5 pointer-events-none">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png" className="h-4" alt="event" />
          <span className="text-gray-700 font-medium">Events</span>
        </div>
      )}
    </div>
  );
}