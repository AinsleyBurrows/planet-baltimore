import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { MapPin, Store, Palette, User, ArrowRight, Loader2 } from 'lucide-react';

/* Haversine distance in miles between two lat/lng points */
function distanceMi(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function NearbyCard({ to, image, name, meta, description, fallbackLetter }) {
  return (
    <Link
      to={to}
      className="group bg-card border border-border rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#d4580a]/40"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-accent/40 font-black text-5xl">
            {fallbackLetter || '?'}
          </div>
        )}
        {meta && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/55 text-white backdrop-blur-sm">
            {meta}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="font-semibold text-foreground text-sm leading-tight">{name}</p>
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
        )}
        <span className="mt-2 text-xs font-medium text-[#d4580a] flex items-center gap-1">
          View <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

function Section({ icon: Icon, title, items, renderCard, emptyText }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="font-bold text-foreground flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-foreground" />
        {title}
        <span className="text-xs font-normal text-muted-foreground">({items.length})</span>
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.slice(0, 8).map(renderCard)}
      </div>
    </div>
  );
}

export default function NearbyOnPlanetBaltimore({ festival }) {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [artists, setArtists] = useState([]);

  const neighborhood = festival?.neighborhood;
  const lat = festival?.coordinates?.lat;
  const lng = festival?.coordinates?.lng;

  useEffect(() => {
    let cancelled = false;
    if (!neighborhood) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const [biz, org, art] = await Promise.all([
          base44.entities.BusinessPage.filter({ neighborhood_name: neighborhood }, '-updated_date', 12).catch(() => []),
          base44.entities.ArtsOrganization.filter({ neighborhood_name: neighborhood }, '-updated_date', 12).catch(() => []),
          base44.entities.ArtistPage.filter({ neighborhood_name: neighborhood }, '-updated_date', 12).catch(() => []),
        ]);

        if (cancelled) return;

        // Arts orgs: sort by distance when coordinates are available
        const orgsWithDist = org
          .filter((o) => !o.is_muted)
          .map((o) => ({
            ...o,
            _dist: distanceMi(lat, lng, o.latitude, o.longitude),
          }))
          .sort((a, b) => (a._dist == null ? 1 : b._dist == null ? -1 : a._dist - b._dist));

        setBusinesses(biz.filter((b) => !b.is_muted));
        setOrgs(orgsWithDist);
        setArtists(art.filter((a) => !a.is_muted));
      } catch {
        if (!cancelled) {
          setBusinesses([]);
          setOrgs([]);
          setArtists([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [neighborhood, lat, lng]);

  const total = businesses.length + orgs.length + artists.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Finding nearby spots…
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">No nearby listings yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          {neighborhood
            ? `Be the first business, organization, or artist from ${neighborhood} to appear here.`
            : 'Add a neighborhood to this festival to show nearby spots.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Section
        icon={Store}
        title="Nearby Businesses"
        items={businesses}
        renderCard={(b) => (
          <NearbyCard
            key={b.id}
            to={`/businesses/${b.id}`}
            image={b.image_url}
            name={b.name}
            meta={b.category}
            description={b.description}
            fallbackLetter={b.name?.charAt(0)}
          />
        )}
      />
      <Section
        icon={Palette}
        title="Nearby Arts Organizations"
        items={orgs}
        renderCard={(o) => (
          <NearbyCard
            key={o.id}
            to={`/arts-organizations/${o.id}`}
            image={o.image_url}
            name={o.name}
            meta={o.org_type || o.neighborhood_name}
            description={o.description || o.mission}
            fallbackLetter={o.name?.charAt(0)}
          />
        )}
      />
      <Section
        icon={User}
        title="Nearby Artists"
        items={artists}
        renderCard={(a) => (
          <NearbyCard
            key={a.id}
            to={`/artists/${a.id}`}
            image={a.image_url}
            name={a.name}
            meta={a.category}
            description={a.bio}
            fallbackLetter={a.name?.charAt(0)}
          />
        )}
      />
    </div>
  );
}