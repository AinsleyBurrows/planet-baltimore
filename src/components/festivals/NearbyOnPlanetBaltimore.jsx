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

const NEARBY_RADIUS_MI = 15; // Baltimore-area proximity radius

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

function Section({ icon: Icon, title, items, renderCard }) {
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
  const hasCoords = lat != null && lng != null;
  const nbh = (neighborhood || '').toLowerCase().trim();

  useEffect(() => {
    let cancelled = false;
    // Need at least a neighborhood or coordinates to find nearby listings.
    if (!nbh && !hasCoords) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const [biz, org, art] = await Promise.all([
          base44.entities.BusinessPage.list('-updated_date', 80).catch(() => []),
          base44.entities.ArtsOrganization.list('-updated_date', 80).catch(() => []),
          base44.entities.ArtistPage.list('-updated_date', 80).catch(() => []),
        ]);
        if (cancelled) return;

        const matchNbh = (item) =>
          nbh && (item.neighborhood_name || '').toLowerCase().trim() === nbh;

        // Businesses & artists have no coordinates, so we match by neighborhood.
        // Sort so the most active/established listings surface first.
        const byActivity = (a, b) => {
          if (!!b.is_verified !== !!a.is_verified) return b.is_verified - a.is_verified;
          if (!!b.is_founding_member !== !!a.is_founding_member)
            return (b.is_founding_member ? 1 : 0) - (a.is_founding_member ? 1 : 0);
          return (b.followers_count || 0) - (a.followers_count || 0);
        };
        setBusinesses(
          biz.filter((b) => !b.is_muted && matchNbh(b)).sort(byActivity)
        );
        setArtists(
          art.filter((a) => !a.is_muted && matchNbh(a)).sort(byActivity)
        );

        // Arts organizations have lat/lng — pull everything within the radius,
        // supplemented by neighborhood matches, then sort by distance.
        const orgByProximity = org
          .filter((o) => !o.is_muted)
          .map((o) => ({
            ...o,
            _dist: hasCoords ? distanceMi(lat, lng, o.latitude, o.longitude) : null,
          }))
          .filter((o) => {
            if (hasCoords && o._dist != null && o._dist <= NEARBY_RADIUS_MI) return true;
            if (matchNbh(o)) return true;
            return false;
          })
          .sort((a, b) => {
            if (a._dist == null && b._dist == null) return 0;
            if (a._dist == null) return 1;
            if (b._dist == null) return -1;
            return a._dist - b._dist;
          });
        setOrgs(orgByProximity);
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
  }, [nbh, lat, lng, hasCoords]);

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
          {neighborhood || hasCoords
            ? 'Be the first business, organization, or artist from this area to appear here.'
            : 'Add a neighborhood or location to this festival to show nearby spots.'}
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
        renderCard={(o) => {
          const distLabel = o._dist != null ? `${o._dist.toFixed(1)} mi` : null;
          const meta = [o.org_type, distLabel].filter(Boolean).join(' · ');
          return (
            <NearbyCard
              key={o.id}
              to={`/arts-organizations/${o.id}`}
              image={o.image_url}
              name={o.name}
              meta={meta || o.neighborhood_name}
              description={o.description || o.mission}
              fallbackLetter={o.name?.charAt(0)}
            />
          );
        }}
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