import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, User, Users, Palette, Building2, Landmark, BookOpen, Shield, X, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const SECTIONS = [
  { key: 'all', label: 'All' },
  { key: 'people', label: 'People' },
  { key: 'stories', label: 'Stories' },
  { key: 'communities', label: 'Groups/Communities' },
  { key: 'artists', label: 'Artists' },
  { key: 'businesses', label: 'Businesses' },
  { key: 'arts_orgs', label: 'Arts Orgs' },
  { key: 'associations', label: 'Community Associations' },
  { key: 'events', label: 'Events' },
];

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults({});
      return;
    }
    const q = debouncedQuery.toLowerCase();
    setLoading(true);

    const searches = [
      base44.entities.User.list('-created_date', 200),
      base44.entities.Story.filter({ status: 'published' }, '-created_date', 200),
      base44.entities.Community.list('-created_date', 200),
      base44.entities.ArtistPage.list('-created_date', 200),
      base44.entities.BusinessPage.list('-created_date', 200),
      base44.entities.ArtsOrganization.list('-created_date', 200),
      base44.entities.CommunityAssociation.list('-created_date', 200),
      base44.entities.Event.list('-date', 200),
    ];

    Promise.all(searches).then(([users, stories, communities, artists, businesses, artsOrgs, associations, events]) => {
      const match = (str) => str?.toLowerCase().includes(q);

      setResults({
        people: users.filter(u => match(u.full_name) || match(u.email) || match(u.bio)),
        stories: stories.filter(s => match(s.title) || match(s.subtitle) || match(s.author_name) || s.tags?.some(t => match(t))),
        communities: communities.filter(c => match(c.name) || match(c.description) || match(c.neighborhood_name)),
        artists: artists.filter(a => match(a.name) || match(a.bio) || match(a.neighborhood_name)),
        businesses: businesses.filter(b => match(b.name) || match(b.description) || match(b.neighborhood_name)),
        arts_orgs: artsOrgs.filter(o => match(o.name) || match(o.description) || match(o.neighborhood_name)),
        associations: associations.filter(a => match(a.name) || match(a.description) || match(a.neighborhood_name)),
        events: events.filter(e => match(e.title) || match(e.description) || match(e.venue_name) || match(e.neighborhood_name) || match(e.organizer_name)),
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [debouncedQuery]);

  const total = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const visible = (key) => filter === 'all' || filter === key;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 p-8 sm:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">Search</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Find people, stories, communities, artists, and more across Baltimore.</p>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search people, stories, communities, artists…"
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === s.key ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!query.trim() && (
        <div className="text-center py-16 text-muted-foreground">
          <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Search for people, stories, communities, artists, businesses, and more</p>
        </div>
      )}

      {query.trim() && loading && (
        <div className="text-center py-10 text-muted-foreground text-sm">Searching…</div>
      )}

      {query.trim() && !loading && total === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">No results for "{query}"</div>
      )}

      {!loading && total > 0 && (
        <div className="space-y-6">
          {/* People */}
          {visible('people') && results.people?.length > 0 && (
            <ResultSection title="People" icon={User} count={results.people.length}>
              {results.people.map(u => (
                <Link key={u.id} to={`/profile/${u.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={u.avatar_url} />
                    <AvatarFallback className="bg-accent/10 text-accent text-sm">{u.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                    {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                  </div>
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Stories */}
          {visible('stories') && results.stories?.length > 0 && (
            <ResultSection title="Stories" icon={BookOpen} count={results.stories.length}>
              {results.stories.map(s => (
                <Link key={s.id} to={`/stories/${s.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  {s.cover_image && <img src={s.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                  {!s.cover_image && <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 text-accent" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">by {s.author_name} {s.category && `· ${s.category}`}</p>
                  </div>
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Communities */}
          {visible('communities') && results.communities?.length > 0 && (
            <ResultSection title="Groups/Communities" icon={Users} count={results.communities.length}>
              {results.communities.map(c => (
                <Link key={c.id} to={`/communities/${c.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0 rounded-lg">
                    <AvatarImage src={c.image_url} className="rounded-lg" />
                    <AvatarFallback className="bg-accent/10 text-accent text-sm rounded-lg">{c.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {c.neighborhood_name && <p className="text-xs text-muted-foreground truncate">{c.neighborhood_name}</p>}
                  </div>
                  {c.members_count > 0 && <Badge variant="secondary" className="text-xs flex-shrink-0">{c.members_count} members</Badge>}
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Artists */}
          {visible('artists') && results.artists?.length > 0 && (
            <ResultSection title="Artists" icon={Palette} count={results.artists.length}>
              {results.artists.map(a => (
                <Link key={a.id} to={`/artists/${a.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={a.image_url} />
                    <AvatarFallback className="bg-accent/10 text-accent text-sm">{a.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.category} {a.neighborhood_name && `· ${a.neighborhood_name}`}</p>
                  </div>
                  {a.is_verified && <Badge className="text-xs flex-shrink-0 bg-accent/10 text-accent border-0">Verified</Badge>}
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Businesses */}
          {visible('businesses') && results.businesses?.length > 0 && (
            <ResultSection title="Businesses" icon={Building2} count={results.businesses.length}>
              {results.businesses.map(b => (
                <Link key={b.id} to={`/businesses/${b.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0 rounded-lg">
                    <AvatarImage src={b.image_url} className="rounded-lg" />
                    <AvatarFallback className="bg-accent/10 text-accent text-sm rounded-lg">{b.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.category} {b.neighborhood_name && `· ${b.neighborhood_name}`}</p>
                  </div>
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Arts Orgs */}
          {visible('arts_orgs') && results.arts_orgs?.length > 0 && (
            <ResultSection title="Arts Organizations" icon={Landmark} count={results.arts_orgs.length}>
              {results.arts_orgs.map(o => (
                <Link key={o.id} to={`/arts-organizations/${o.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0 rounded-lg">
                    <AvatarImage src={o.image_url} className="rounded-lg" />
                    <AvatarFallback className="bg-accent/10 text-accent text-sm rounded-lg">{o.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{o.name}</p>
                    {o.neighborhood_name && <p className="text-xs text-muted-foreground truncate">{o.neighborhood_name}</p>}
                  </div>
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Events */}
          {visible('events') && results.events?.length > 0 && (
            <ResultSection title="Events" icon={Calendar} count={results.events.length}>
              {results.events.map(e => (
                <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  {e.image_url
                    ? <img src={e.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0"><Calendar className="w-5 h-5 text-accent" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.venue_name || e.neighborhood_name}{e.date ? ` · ${new Date(e.date).toLocaleDateString()}` : ''}</p>
                  </div>
                  {e.is_free && <Badge className="text-xs flex-shrink-0 bg-green-100 text-green-700 border-0">Free</Badge>}
                </Link>
              ))}
            </ResultSection>
          )}

          {/* Associations */}
          {visible('associations') && results.associations?.length > 0 && (
            <ResultSection title="Community Associations" icon={Shield} count={results.associations.length}>
              {results.associations.map(a => (
                <Link key={a.id} to={`/community-associations/${a.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors">
                  <Avatar className="w-10 h-10 flex-shrink-0 rounded-lg">
                    <AvatarImage src={a.image_url} className="rounded-lg" />
                    <AvatarFallback className="bg-accent/10 text-accent text-sm rounded-lg">{a.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    {a.neighborhood_name && <p className="text-xs text-muted-foreground truncate">{a.neighborhood_name}</p>}
                  </div>
                </Link>
              ))}
            </ResultSection>
          )}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, icon: Icon, count, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-accent" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground">({count})</span>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {children}
      </div>
    </div>
  );
}