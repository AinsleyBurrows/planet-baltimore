import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LAYERS } from '@/pages/CityMap';

// Fix leaflet asset path issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BALTIMORE_CENTER = [39.2904, -76.6122];

function FlyToPin({ pin }) {
  const map = useMap();
  useEffect(() => {
    if (pin?.lat && pin?.lng) {
      map.flyTo([pin.lat, pin.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
    }
  }, [pin, map]);
  return null;
}

function PinLayer({ pins, selectedPin, onSelectPin }) {
  return pins.map(pin => {
    const layer = LAYERS[pin.type];
    const isSelected = selectedPin?.id === pin.id;

    return (
      <CircleMarker
        key={pin.id}
        center={[pin.lat, pin.lng]}
        radius={isSelected ? 12 : 8}
        pathOptions={{
          fillColor: layer.color,
          fillOpacity: isSelected ? 1 : 0.85,
          color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)',
          weight: isSelected ? 3 : 1.5,
        }}
        eventHandlers={{ click: () => onSelectPin(pin) }}
      >
        <Popup>
          <div className="min-w-[160px] text-sm">
            <div className="font-semibold text-gray-800 leading-snug">{pin.title}</div>
            {pin.subtitle && (
              <div className="text-xs capitalize mt-0.5" style={{ color: layer.color }}>{pin.subtitle}</div>
            )}
            {pin.meta && <div className="text-xs text-gray-500 mt-0.5">{pin.meta}</div>}
            <a
              href={pin.link}
              className="mt-2 block text-xs font-medium hover:underline"
              style={{ color: layer.color }}
            >
              View details →
            </a>
          </div>
        </Popup>
      </CircleMarker>
    );
  });
}

export default function CityMapView({ pins, selectedPin, onSelectPin }) {
  return (
    <MapContainer
      center={BALTIMORE_CENTER}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToPin pin={selectedPin} />
      <PinLayer pins={pins} selectedPin={selectedPin} onSelectPin={onSelectPin} />
    </MapContainer>
  );
}