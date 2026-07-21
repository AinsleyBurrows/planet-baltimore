import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Ticket, Navigation } from 'lucide-react';

const orangeIcon = L.divIcon({
  className: 'festival-map-pin',
  html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#d4580a" stroke="white" stroke-width="2.2" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.6" fill="white" stroke="none"/></svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 24],
  popupAnchor: [0, -22],
});

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 13), { duration: 0.7 });
  }, [target]);
  return null;
}

export default function FestivalMapView({ festivals }) {
  const [neighborhood, setNeighborhood] = useState('All');
  const [selected, setSelected] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const markerRefs = useRef({});

  const neighborhoods = useMemo(() => {
    const counts = {};
    festivals.forEach((f) => { if (f.neighborhood) counts[f.neighborhood] = (counts[f.neighborhood] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [festivals]);

  const list = useMemo(
    () => (neighborhood === 'All' ? festivals : festivals.filter((f) => f.neighborhood === neighborhood)),
    [festivals, neighborhood],
  );
  const markers = useMemo(
    () => festivals.filter((f) => f.coordinates?.lat && f.coordinates?.lng && (neighborhood === 'All' || f.neighborhood === neighborhood)),
    [festivals, neighborhood],
  );

  const select = (f) => {
    setSelected(f.slug);
    if (f.coordinates?.lat) setFlyTarget([f.coordinates.lat, f.coordinates.lng]);
    setTimeout(() => { markerRefs.current[f.slug]?.openPopup(); }, 350);
  };

  if (!festivals.length) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-xl">
        <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4"><MapPin className="w-7 h-7 text-accent" /></div>
        <h3 className="font-semibold text-foreground mb-1">No active festivals to map</h3>
        <p className="text-sm text-muted-foreground">Check back soon — new festivals are added regularly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold text-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#d4580a]" />Active Festivals Map</h2>
        <span className="text-xs text-muted-foreground">{festivals.length} active · {neighborhoods.length} neighborhoods</span>
      </div>

      {/* neighborhood chips */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setNeighborhood('All')} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${neighborhood === 'All' ? 'bg-[#d4580a] text-white border-[#d4580a]' : 'border-border text-muted-foreground hover:bg-secondary'}`}>All ({festivals.length})</button>
        {neighborhoods.map((n) => (
          <button key={n.name} onClick={() => setNeighborhood(n.name)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${neighborhood === n.name ? 'bg-[#d4580a] text-white border-[#d4580a]' : 'border-border text-muted-foreground hover:bg-secondary'}`}>{n.name} ({n.count})</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* map */}
        <div className="rounded-xl overflow-hidden border border-border order-2 lg:order-1" style={{ height: 480 }}>
          <MapContainer center={[39.3, -76.62]} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <FlyTo target={flyTarget} />
            {markers.map((f) => (
              <Marker
                key={f.slug}
                position={[f.coordinates.lat, f.coordinates.lng]}
                icon={orangeIcon}
                ref={(ref) => { if (ref) markerRefs.current[f.slug] = ref; }}
                eventHandlers={{ click: () => setSelected(f.slug) }}
              >
                <Popup>
                  <div style={{ minWidth: 190 }} className="space-y-1">
                    <strong className="text-foreground">{f.name}</strong>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{new Date(f.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{f.neighborhood || 'Baltimore'}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Ticket className="w-3 h-3" />{f.admission.type === 'free' ? 'Free' : (f.admission.price || 'Ticketed')}</div>
                    <Link to={`/festivals/${f.slug}`} className="text-xs font-medium hover:underline" style={{ color: '#d4580a' }}>View Festival →</Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* list */}
        <div className="order-1 lg:order-2 space-y-2 max-h-[480px] overflow-y-auto pr-1">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No active festivals in {neighborhood}.</p>
          ) : list.map((f) => (
            <button
              key={f.slug}
              onClick={() => select(f)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${selected === f.slug ? 'border-[#d4580a] bg-[#d4580a]/5' : 'border-border bg-card hover:bg-secondary/50'}`}
            >
              {f.image ? (
                <img src={f.image} alt={f.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5" /></div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{f.neighborhood || 'Baltimore'} · {new Date(f.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <p className="text-[11px] text-muted-foreground">{f.admission.type === 'free' ? 'Free' : (f.admission.price || 'Ticketed')}</p>
              </div>
              {f.coordinates?.lat && <Navigation className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}