import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Palette, Building2, Store, ArrowRight, Sparkles } from 'lucide-react';

function DiscoverCard({ to, image, name, subtitle, Icon, fallbackLetter }) {
  return (
    <Link
      to={to}
      className="group bg-card border border-border rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-[#d4580a]/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {image ? (
          <img src={image} alt={name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-black text-5xl">
            {fallbackLetter || <Icon className="w-8 h-8" />}
          </div>
        )}
        <span className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/55 text-white backdrop-blur-sm">
          <Icon className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className="p-3 flex-1 flex flex-col">
        <p className="font-semibold text-sm text-foreground line-clamp-1">{name}</p>
        {subtitle && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{subtitle}</p>}
        <span className="text-xs text-[#d4580a] font-medium mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          View <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

function Column({ title, Icon, to, results, loading, getCard }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-foreground" />
          {title}
        </h3>
        <Link to={to} className="text-xs text-[#d4580a] font-medium hover:underline">See all</Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {[0, 1].map(i => <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : results.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center bg-secondary/40 rounded-xl">None nearby yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {results.slice(0, 4).map(getCard)}
        </div>
      )}
    </div>
  );
}

export default function FestivalDiscoverSection({ neighborhood }) {
  const filter = neighborhood ? { neighborhood_name: neighborhood } : {};

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['festival_discover_artists', neighborhood],
    queryFn: () => base44.entities.ArtistPage.filter(filter, '-followers_count', 8),
    staleTime: 60000,
  });

  const { data: orgs = [], isLoading: loadingOrgs } = useQuery({
    queryKey: ['festival_discover_orgs', neighborhood],
    queryFn: () => base44.entities.ArtsOrganization.filter(filter, '-followers_count', 8),
    staleTime: 60000,
  });

  const { data: businesses = [], isLoading: loadingBiz } = useQuery({
    queryKey: ['festival_discover_businesses', neighborhood],
    queryFn: () => base44.entities.BusinessPage.filter(filter, '-created_date', 8),
    staleTime: 60000,
  });

  const hasAny = artists.length > 0 || orgs.length > 0 || businesses.length > 0;

  return (
    <section className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-foreground" />
        <h2 className="font-bold text-lg text-foreground">
          Discover on Planet Baltimore
          {neighborhood && <span className="text-muted-foreground font-normal text-sm ml-1.5">in {neighborhood}</span>}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Explore the artists, organizations, and businesses that make Baltimore's creative community thrive.
      </p>

      {!hasAny && !loadingArtists && !loadingOrgs && !loadingBiz ? (
        <p className="text-center py-8 text-sm text-muted-foreground bg-secondary/40 rounded-xl">
          Discover more of Baltimore's creative community on Planet Baltimore.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Column
            title="Artists"
            Icon={Palette}
            to="/artists"
            results={artists}
            loading={loadingArtists}
            getCard={(a) => (
              <DiscoverCard
                key={a.id}
                to={`/artists/${a.id}`}
                image={a.image_url}
                name={a.name}
                subtitle={a.neighborhood_name || a.category}
                Icon={Palette}
                fallbackLetter={a.name?.charAt(0)}
              />
            )}
          />
          <Column
            title="Arts Organizations"
            Icon={Building2}
            to="/arts-organizations"
            results={orgs}
            loading={loadingOrgs}
            getCard={(o) => (
              <DiscoverCard
                key={o.id}
                to={`/arts-organizations/${o.id}`}
                image={o.image_url}
                name={o.name}
                subtitle={o.org_type || o.neighborhood_name}
                Icon={Building2}
                fallbackLetter={o.name?.charAt(0)}
              />
            )}
          />
          <Column
            title="Businesses"
            Icon={Store}
            to="/businesses"
            results={businesses}
            loading={loadingBiz}
            getCard={(b) => (
              <DiscoverCard
                key={b.id}
                to={`/businesses/${b.id}`}
                image={b.image_url}
                name={b.name}
                subtitle={b.neighborhood_name || b.business_type}
                Icon={Store}
                fallbackLetter={b.name?.charAt(0)}
              />
            )}
          />
        </div>
      )}
    </section>
  );
}