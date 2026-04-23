import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const artIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BALTIMORE_CENTER = [39.2904, -76.6122];

export default function ArtsOrgMap({ orgs = [] }) {
  return (
    <MapContainer center={BALTIMORE_CENTER} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {orgs.map(org => (
        <Marker key={org.id} position={[org.latitude, org.longitude]} icon={artIcon}>
          <Popup>
            <div className="min-w-[140px]">
              <p className="font-semibold text-sm">{org.name}</p>
              <p className="text-xs text-gray-500 capitalize">{org.org_type?.replace(/_/g, ' ')}</p>
              {org.neighborhood_name && <p className="text-xs text-gray-500">{org.neighborhood_name}</p>}
              <a href={`/arts-organizations/${org.id}`} className="mt-2 block text-xs font-medium text-blue-600 hover:underline">View Profile →</a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}