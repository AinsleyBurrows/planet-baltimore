import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { festivals, FESTIVAL_CATEGORIES, FESTIVAL_NEIGHBORHOODS } from '@/data/festivals';
import { base44 } from '@/api/base44Client';
import { dbFestivalToShape } from '@/lib/festivalShape';
import {
  Search, MapPin, Calendar, Compass, LayoutGrid, Star, Users, Bookmark,
  Filter, ChevronDown, Sparkles, Landmark, Ticket, Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FestivalCard from '@/components/festivals/FestivalCard';
import FeaturedFestival from '@/components/festivals/FeaturedFestival';
import FestivalQuickFilters from '@/components/festivals/FestivalQuickFilters';
import FestivalMapView from '@/components/festivals/FestivalMapView';
import { useSavedFestivals } from '@/components/festivals/SaveButton';

/* ---------- date helpers ---------- */
const parse = (d) => new Date(d + 'T00:00:00');
const isActiveOn = (f, date) => {
  const s = parse(f.startDate), e = parse(f.endDate || f.startDate), t = parse(date.toISOString().slice(0, 10));
  return t >= s && t <= e;
};
const isUpcoming = (f) => parse(f.endDate || f.startDate) >= parse(new Date().toISOString().slice(0, 10));
const weekendRange = () => {
  const now = new Date();
  const day = now.getDay();
  const fri = new Date(now); fri.setDate(now.getDate() - ((day + 2) % 7));
  const sun = new Date(fri); sun.setDate(fri.getDate() + 2);
  return { start: fri, end: sun };
};
const isThisWeekend = (f) => {
  const { start, end } = weekendRange();
  const s = parse(f.startDate), e = parse(f.endDate || f.startDate);
  return s <= end && e >= start;
};
const isThisMonth = (f) => {
  const now = new Date();
  const s = parse(f.startDate);
  return s.getMonth() === now.getMonth() && s.getFullYear() === now.getFullYear();
};
const isHappeningSoon = (f) => {
  const now = new Date();
  const horizon = new Date(now.getTime() + 14 * 86400000);
  const s = parse(f.startDate);
  return s >= parse(now.toISOString().slice(0, 10)) && s <= horizon;
};
const isToday = (f) => isActiveOn(f, new Date());

const QUICK_PREDICATES = {
  'Today': isToday,
  'This Weekend': isThisWeekend,
  'This Month': isThisMonth,
  'Free': (f) => f.admission.type === 'free',
  'Family Friendly': (f) => f.categories.includes('family') || f.audience === 'All Ages' || (f.statusBadges || []).includes('Family Friendly'),
  'Arts': (f) => f.categories.includes('arts'),
  'Music': (f) => f.categories.includes('music'),
  'Food': (f) => f.categories.includes('food'),
  'Culture': (f) => f.categories.includes('cultural') || f.categories.includes('caribbean') || f.categories.includes('african_diaspora') || f.categories.includes('latino'),
  'Film': (f) => f.categories.includes('film'),
  'Literature': (f) => f.categories.includes('literature') || f.categories.includes('poetry'),
  'Nightlife': (f) => (f.statusBadges || []).includes('21+') || f.audience === '21+',
  'Neighborhood Festivals': (f) => f.categories.includes('neighborhood'),
};

/* ---------- filter panel ---------- */
const FILTER_GROUPS = [
  { key: 'date', label: 'Date', options: ['Today', 'This Weekend', 'This Month'] },
  { key: 'price', label: 'Price', options: ['Free', 'Paid', 'Donation-Based'] },
  { key: 'category', label: 'Category', options: ['Arts', 'Music', 'Food', 'Film', 'Literature', 'Pride', 'Caribbean', 'Family', 'Neighborhood'] },
  { key: 'audience', label: 'Audience', options: ['All Ages', 'Family Friendly', '21+'] },
  { key: 'format', label: 'Format', options: ['Outdoor', 'Indoor', 'Street Festival'] },
];

function FilterPanel({ filters, setFilters, onClear }) {
  const toggle = (group, val) => setFilters(prev => {
    const arr = prev[group] || [];
    return { ...prev, [group]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
  });
  const activeCount = Object.values(filters).flat().length;
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-1.5"><Filter className="w-4 h-4 text-[#d4580a]" />Filters {activeCount > 0 && <span className="text-xs text-muted-foreground">({activeCount})</span>}</h3>
        {activeCount > 0 && <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>}
      </div>
      {FILTER_GROUPS.map(g => (
        <div key={g.key}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{g.label}</p>
          <div className="flex flex-wrap gap-1.5">
            {g.options.map(o => {
              const active = (filters[g.key] || []).includes(o);
              return (
                <button key={o} onClick={() => toggle(g.key, o)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? 'bg-[#d4580a] text-white border-[#d4580a]' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function applyPanelFilters(list, filters) {
  return list.filter(f => {
    if ((filters.price || []).length) {
      const match = (filters.price || []).some(p =>
        p === 'Free' ? f.admission.type === 'free' :
        p === 'Paid' ? f.admission.type === 'paid' :
        p === 'Donation-Based' ? f.admission.type === 'donation' : false);
      if (!match) return false;
    }
    if ((filters.category || []).length) {
      const match = (filters.category || []).some(c => f.categories.includes(c.toLowerCase().replace(/ /g, '_')) || f.categories.includes(c.toLowerCase()));
      if (!match) return false;
    }
    if ((filters.audience || []).length) {
      const match = (filters.audience || []).some(a =>
        a === 'Family Friendly' ? (f.categories.includes('family') || f.audience === 'All Ages') :
        a === 'All Ages' ? f.audience === 'All Ages' :
        a === '21+' ? f.audience === '21+' : false);
      if (!match) return false;
    }
    if ((filters.format || []).length && !(filters.format || []).includes(f.format)) return false;
    return true;
  });
}

/* ---------- section header ---------- */
function Section({ title, children, action }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

const CATEGORY_IMAGE = (label) => `https://picsum.photos/seed/cat-${label.replace(/[^a-z]/gi, '')}/600/400`;

export default function Festivals() {
  const [search, setSearch] = useState('');
  const [quick, setQuick] = useState([]);
  const [panelFilters, setPanelFilters] = useState({});
  const [showPanel, setShowPanel] = useState(false);
  const [tab, setTab] = useState('discover');
  const { saved } = useSavedFestivals();
  const [userFestivals, setUserFestivals] = useState([]);

  const loadUserFestivals = React.useCallback(async (signal) => {
    try {
      const records = await base44.entities.Festival.filter({ status: 'published' }, '-created_date', 50);
      if (!signal.aborted) setUserFestivals(records.map(dbFestivalToShape).filter(Boolean));
    } catch { /* directory still shows curated festivals */ }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadUserFestivals(controller);
    const onChange = () => loadUserFestivals(controller);
    window.addEventListener('pb_festival_feature_change', onChange);
    return () => { controller.abort(); window.removeEventListener('pb_festival_feature_change', onChange); };
  }, [loadUserFestivals]);

  const toggleQuick = (f) => setQuick(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const matchesSearch = (f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) ||
      f.neighborhood.toLowerCase().includes(q) ||
      f.categories.some(c => c.includes(q)) || (f.tags || []).some(t => t.toLowerCase().includes(q));
  };

  const filtered = useMemo(() => {
    let list = festivals.filter(matchesSearch);
    if (quick.length) list = list.filter(f => quick.every(q => (QUICK_PREDICATES[q] || (() => true))(f)));
    list = applyPanelFilters(list, panelFilters);
    return list;
  }, [search, quick, panelFilters]);

  const dbFeatured = userFestivals.filter(f => f.featured);
  const featured = dbFeatured[0] || festivals.find(f => f.featured) || festivals[0];
  const upcoming = festivals.filter(isUpcoming).sort((a, b) => parse(a.startDate) - parse(b.startDate));
  const hasFilters = search || quick.length || Object.values(panelFilters).flat().length;

  const categoryCards = FESTIVAL_CATEGORIES.filter(c =>
    ['arts', 'music', 'food', 'film', 'literature', 'caribbean', 'african_diaspora', 'latino', 'asian', 'pride', 'family', 'neighborhood', 'holiday', 'wellness', 'market'].includes(c.value)
  ).map(c => {
    const count = festivals.filter(f => f.categories.includes(c.value) && isUpcoming(f)).length;
    return { ...c, count };
  });

  const neighborhoodCards = FESTIVAL_NEIGHBORHOODS.map(n => {
    const fs = festivals.filter(f => f.neighborhood === n);
    const next = fs.filter(isUpcoming).sort((a, b) => parse(a.startDate) - parse(b.startDate))[0];
    return { name: n, count: fs.filter(isUpcoming).length, next };
  }).filter(n => n.count > 0 || festivals.some(f => f.neighborhood === n));

  const organizers = useMemo(() => {
    const map = {};
    festivals.forEach(f => {
      const key = f.organizer.name;
      if (!map[key]) map[key] = { ...f.organizer, festivals: [] };
      map[key].festivals.push(f);
    });
    return Object.values(map);
  }, []);

  const activeFestivals = useMemo(() => {
    const all = [...festivals, ...userFestivals];
    return all.filter(isUpcoming);
  }, [userFestivals]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#d4580a' }}>Festivals</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Discover Baltimore’s festivals, celebrations, performances, food, art, and culture.</p>
          </div>
          <Link to="/create-festival" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ backgroundColor: '#d4580a' }}>
            <Plus className="w-4 h-4" />Create a Festival
          </Link>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search festivals, neighborhoods, artists, or categories" className="pl-9 rounded-xl bg-secondary/50 border-0" />
      </div>

      {/* Featured */}
      {!hasFilters && <FeaturedFestival festival={featured} />}

      {/* Quick filters */}
      <FestivalQuickFilters active={quick} onToggle={toggleQuick} onClear={() => setQuick([])} />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-secondary/50 rounded-xl p-1 h-auto flex overflow-x-auto scrollbar-hide gap-0.5 justify-start">
          {[
            { v: 'discover', l: 'Discover', I: Compass },
            { v: 'calendar', l: 'Calendar', I: Calendar },
            { v: 'map', l: 'Map', I: MapPin },
            { v: 'categories', l: 'Categories', I: LayoutGrid },
            { v: 'neighborhoods', l: 'Neighborhoods', I: Landmark },
            { v: 'organizers', l: 'Organizers', I: Users },
            { v: 'saved', l: 'Saved', I: Bookmark },
          ].map(t => {
            const Icon = t.I;
            return <TabsTrigger key={t.v} value={t.v} className="rounded-lg flex items-center gap-1.5 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><Icon className="w-3.5 h-3.5" /><span className="hidden xs:inline">{t.l}</span></TabsTrigger>;
          })}
        </TabsList>

        {/* Discover */}
        <TabsContent value="discover" className="mt-5 space-y-8">
          <div className="flex items-center justify-end">
            <button onClick={() => setShowPanel(v => !v)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
              <Filter className="w-4 h-4" />Filters {Object.values(panelFilters).flat().length > 0 && <span className="text-xs bg-[#d4580a] text-white rounded-full px-1.5">{Object.values(panelFilters).flat().length}</span>}
              <ChevronDown className={`w-4 h-4 transition-transform ${showPanel ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {showPanel && <FilterPanel filters={panelFilters} setFilters={setPanelFilters} onClear={() => setPanelFilters({})} />}

          {hasFilters ? (
            filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4"><Sparkles className="w-7 h-7 text-accent" /></div>
                <h3 className="font-semibold text-foreground mb-1">No festivals match your filters</h3>
                <p className="text-sm text-muted-foreground">Try clearing some filters or searching for something else.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map(f => <FestivalCard key={f.slug} festival={f} />)}</div>
            )
          ) : (
            <>
              {userFestivals.length > 0 && (
                <Section title="Community-Created Festivals">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userFestivals.map((f) => <FestivalCard key={f.slug} festival={f} />)}
                  </div>
                </Section>
              )}
              <Section title="Happening Soon">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {festivals.filter(isHappeningSoon).map(f => <FestivalCard key={f.slug} festival={f} />)}
                </div>
              </Section>
              <Section title="This Weekend">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {festivals.filter(isThisWeekend).map(f => <FestivalCard key={f.slug} festival={f} />)}
                </div>
              </Section>
              <Section title="Featured Festivals">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...dbFeatured, ...festivals.filter(f => f.featured || (f.statusBadges || []).length > 0)]
                    .filter((f, i, arr) => arr.findIndex(x => x.slug === f.slug) === i)
                    .slice(0, 6)
                    .map(f => <FestivalCard key={f.slug || f.id} festival={f} />)}
                </div>
              </Section>
              <Section title="Free Festivals">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {festivals.filter(f => f.admission.type === 'free').map(f => <FestivalCard key={f.slug} festival={f} />)}
                </div>
              </Section>
              <Section title="Browse by Category">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {categoryCards.map(c => (
                    <button key={c.value} onClick={() => { setQuick([c.label]); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="relative h-28 rounded-xl overflow-hidden group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <img src={CATEGORY_IMAGE(c.label)} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <p className="font-semibold text-sm">{c.label}</p>
                        <p className="text-[10px] opacity-90">{c.count} upcoming</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Browse by Neighborhood">
                <div className="flex flex-wrap gap-2">
                  {neighborhoodCards.map(n => (
                    <button key={n.name} onClick={() => { setSearch(n.name); setTab('discover'); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary text-sm text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors">
                      <MapPin className="w-3.5 h-3.5" />{n.name}
                      <span className="text-xs text-muted-foreground/70">{n.count}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Upcoming Festivals">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcoming.map(f => <FestivalCard key={f.slug} festival={f} />)}
                </div>
              </Section>
            </>
          )}
        </TabsContent>

        {/* Calendar */}
        <TabsContent value="calendar" className="mt-5 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="font-semibold text-foreground mb-3">Festival Calendar</h2>
            {upcoming.map(f => {
              const d = new Date(f.startDate);
              return (
                <Link key={f.slug} to={`/festivals/${f.slug}`} className="flex items-center gap-3 py-3 border-t border-border first:border-t-0 hover:bg-secondary/40 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-accent/10 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-accent uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-foreground">{d.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{f.neighborhood} · {f.admission.type === 'free' ? 'Free' : f.admission.price}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-shrink-0">
                    {(f.categories || []).slice(0, 2).map(c => <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{c.replace(/_/g, ' ')}</span>)}
                  </div>
                </Link>
              );
            })}
            {/* TODO: connect to full month/week calendar grid + category/neighborhood filters */}
          </div>
        </TabsContent>

        {/* Map */}
        <TabsContent value="map" className="mt-5">
          <FestivalMapView festivals={activeFestivals} />
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryCards.map(c => (
              <button key={c.value} onClick={() => { setQuick([c.label]); setTab('discover'); }} className="bg-card border border-border rounded-xl overflow-hidden text-left hover:shadow-md hover:-translate-y-[1px] transition-all group">
                <div className="h-32 overflow-hidden bg-muted">
                  <img src={CATEGORY_IMAGE(c.label)} alt={c.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground">{c.label}</h3>
                  <p className="text-xs text-muted-foreground">{c.count} upcoming festival{c.count !== 1 ? 's' : ''}</p>
                </div>
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Neighborhoods */}
        <TabsContent value="neighborhoods" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {neighborhoodCards.map(n => (
              <div key={n.name} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="h-24 overflow-hidden bg-muted">
                  <img src={`https://picsum.photos/seed/nh-${n.name.replace(/[^a-z]/gi, '')}/600/300`} alt={n.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" />{n.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{n.count} upcoming festival{n.count !== 1 ? 's' : ''}</p>
                  {n.next && <p className="text-xs text-muted-foreground mt-0.5">Next: {n.next.name} · {new Date(n.next.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
                  <button onClick={() => { setSearch(n.name); setTab('discover'); }} className="mt-2 text-xs font-medium text-[#d4580a] hover:underline">View Festivals →</button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Organizers */}
        <TabsContent value="organizers" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizers.map(o => (
              <div key={o.name} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent font-bold flex items-center justify-center flex-shrink-0">{o.name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{o.name}</h3>
                    <p className="text-xs text-muted-foreground">{o.festivals.length} festival{o.festivals.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {o.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{o.description}</p>}
                <div className="flex gap-2 mt-3">
                  <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#d4580a] text-[#d4580a] hover:bg-[#d4580a]/10 transition-colors"><Users className="w-3.5 h-3.5" />Follow</button>
                  {o.website && <a href={o.website} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#d4580a] hover:underline self-center">View Organization →</a>}
                </div>
                {/* TODO: link organizer to existing Planet Baltimore ArtsOrganization profile when artsOrgId is set */}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Saved */}
        <TabsContent value="saved" className="mt-5">
          {saved.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4"><Bookmark className="w-7 h-7 text-accent" /></div>
              <h3 className="font-semibold text-foreground mb-1">No saved festivals yet</h3>
              <p className="text-sm text-muted-foreground">Tap the Save button on any festival to keep it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {festivals.filter(f => saved.includes(f.slug)).map(f => <FestivalCard key={f.slug} festival={f} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}