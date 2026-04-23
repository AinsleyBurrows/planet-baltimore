import React, { useEffect } from 'react';
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

// Custom coral accent marker for selected
const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
  // Only render neighborhoods that have coordinates
  const pinnable = neighborhoods.filter(n => n.latitude && n.longitude);

  return (
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
        <Marker
          key={n.id}
          position={[n.latitude, n.longitude]}
          icon={selected?.id === n.id ? selectedIcon : defaultIcon}
          eventHandlers={{ click: () => onSelect(n) }}
        >
          <Popup>
            <div className="min-w-[140px]">
              <p className="font-semibold text-sm">{n.name}</p>
              <p className="text-xs text-gray-500">{n.region}</p>
              {n.description && <p className="text-xs mt-1 text-gray-600 line-clamp-2">{n.description}</p>}
              <button
                onClick={() => onSelect(n)}
                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
              >
                Explore →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}