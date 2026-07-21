import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFestivalBySlug } from '@/data/festivals';
import { base44 } from '@/api/base44Client';
import { dbFestivalToShape } from '@/lib/festivalShape';
import {
  ArrowLeft, MapPin, Calendar, Clock, Globe, Navigation, Ticket, Users, Heart,
  Bookmark, Share2, CalendarPlus, Check, Shield, Accessibility, Baby, CloudSun,
  Search, AlertTriangle, Info, Utensils, Store, Palette, Music, Mic, Film, BookOpen,
  Car, Bike, Bus, Sparkles, Star, Pencil,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import SaveButton from '@/components/festivals/SaveButton';
import ShareButton from '@/components/festivals/ShareButton';
import AddToCalendarButton from '@/components/festivals/AddToCalendarButton';
import FollowButton from '@/components/shared/FollowButton';
import ShareModal from '@/components/shared/ShareModal';
import FestivalUpdateComposer from '@/components/festivals/FestivalUpdateComposer';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useCurrentUser } from '@/hooks/useCurrentUser';

/* ---------- local storage hooks ---------- */
const useLocalList = (key) => {
  const [list, setList] = useState(() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } });
  const toggle = (id) => setList(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    localStorage.setItem(key, JSON.stringify(next));
    return next;
  });
  const has = (id) => list.includes(id);
  return { list, toggle, has };
};

function fmtRange(f) {
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  const s = new Date(f.startDate).toLocaleDateString('en-US', opts);
  if (!f.endDate || f.endDate === f.startDate) return s;
  return `${s} – ${new Date(f.endDate).toLocaleDateString('en-US', opts)}`;
}

function ActionBtn({ icon: Icon, label, active, onClick, primary, className = '' }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${primary ? 'text-white' : active ? 'border border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10' : 'border border-border text-foreground hover:bg-secondary'} ${className}`} style={primary ? { backgroundColor: '#d4580a' } : {}}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );
}

function MiniSave({ id, label = 'Save' }) {
  const { has, toggle } = useLocalList('pb_saved_schedule');
  const saved = has(id);
  return <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id); }} className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${saved ? 'border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10' : 'border-border text-muted-foreground hover:bg-secondary'}`}><Bookmark className="w-3.5 h-3.5" />{saved ? 'Saved' : label}</button>;
}

function SectionTitle({ children, icon: Icon }) {
  return <h3 className="font-bold text-foreground flex items-center gap-2 mb-3 mt-6 first:mt-0">{Icon && <Icon className="w-5 h-5 text-[#d4580a]" />}{children}</h3>;
}

function Card({ children, className = '' }) {
  return <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>{children}</div>;
}

const CAT_ICON = { music: Music, poetry: Mic, film: Film, dance: Users, theater: Users, family: Baby, community: Users, arts: Palette, cultural: Sparkles };

export default function FestivalDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const records = await base44.entities.Festival.filter({ slug });
        if (!cancelled) {
          setFestival(records.length ? dbFestivalToShape(records[0]) : getFestivalBySlug(slug));
        }
      } catch {
        if (!cancelled) setFestival(getFestivalBySlug(slug));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const [activeDay, setActiveDay] = useState('');
  const [schedSearch, setSchedSearch] = useState('');
  const [liveMode, setLiveMode] = useState(false);
  const followed = useLocalList('pb_followed_festivals');
  const [tab, setTab] = useState('overview');
  const [shareArtist, setShareArtist] = useState(null);
  const { user } = useCurrentUser();

  const days = useMemo(() => {
    if (!festival) return [];
    const out = [];
    let d = new Date(festival.startDate + 'T00:00:00');
    const end = new Date((festival.endDate || festival.startDate) + 'T00:00:00');
    while (d <= end) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
    return out;
  }, [festival]);

  useEffect(() => { if (days.length) setActiveDay(days[0]); }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-7 h-7 border-2 border-muted border-t-[#d4580a] rounded-full animate-spin" />
      </div>
    );
  }

  if (!festival) {
    return (
      <div className="text-center py-16">
        <h3 className="font-semibold text-foreground mb-1">Festival not found</h3>
        <button onClick={() => navigate('/festivals')} className="mt-4 text-sm text-[#d4580a] font-medium hover:underline">Back to Festivals</button>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const canManage = !!user && !!festival && !!festival.isUserCreated && (user.id === festival.owner_id || user.role === 'admin');
  const isLiveNow = days.includes(today);
  const isFollowing = followed.has(festival.slug);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${festival.coordinates?.lat},${festival.coordinates?.lng}`;
  const emergencies = (festival.updates || []).filter(u => /emergency|alert/i.test(u.type));

  // Merge manually-entered schedule with artist performances so the lineup
  // auto-populates the schedule by day/time. Dedupe by day|time|title.
  const manualSchedule = (festival.schedule || []).map(s => ({ ...s, _source: 'manual' }));
  const artistSchedule = (festival.artists || [])
    .filter(a => a.name)
    .map(a => ({
      day: a.day, time: a.time || '', title: a.name, artist: a.name,
      stage: a.stage || '', category: a.discipline || 'performance',
      description: a.bio || '', _source: 'artist',
    }));
  const headlinerSchedule = (festival.highlights?.headliners || []).map(h => ({
    day: '', time: '', title: h, artist: h, stage: 'Main Stage',
    category: 'headliner', description: 'Festival headliner', _source: 'headliner',
  }));
  const experienceSchedule = (festival.experiences || []).map(e => ({
    day: '', time: '', title: e.title, artist: '', stage: '',
    category: 'experience', description: e.description || '', _source: 'experience',
  }));
  const seen = new Set();
  const mergedSchedule = [...manualSchedule, ...artistSchedule].filter(s => {
    if (!s.day) return false;
    const key = `${s.day}|${(s.time || '').toLowerCase()}|${(s.title || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const featuredExtras = [...headlinerSchedule, ...experienceSchedule];

  const scheduleForDay = mergedSchedule
    .filter(s => !activeDay || s.day === activeDay)
    .filter(s => {
      if (!schedSearch) return true;
      const q = schedSearch.toLowerCase();
      return s.title.toLowerCase().includes(q) || (s.artist || '').toLowerCase().includes(q) || (s.stage || '').toLowerCase().includes(q);
    });

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"><ArrowLeft className="w-5 h-5" /></button>

      {/* Emergency alerts */}
      {emergencies.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          {emergencies.map((u, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div><span className="font-semibold">{u.type}: </span>{u.message}</div>
            </div>
          ))}
        </div>
      )}

      {/* Live Festival Mode */}
      {isLiveNow && !liveMode && (
        <button onClick={() => setLiveMode(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold animate-pulse" style={{ backgroundColor: '#d4580a' }}>
          <Sparkles className="w-5 h-5" />Enter Live Festival Mode
        </button>
      )}
      {liveMode && (
        <Card className="border-[#d4580a]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#d4580a]" />Live Festival Mode</h3>
            <button onClick={() => setLiveMode(false)} className="text-xs text-muted-foreground hover:text-foreground">Exit</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <a href="#map" className="bg-secondary rounded-lg p-3"><MapPin className="w-4 h-4 text-[#d4580a] mb-1" />Nearest restroom<br /><span className="text-muted-foreground">Block B (placeholder)</span></a>
            <a href="#food" className="bg-secondary rounded-lg p-3"><Utensils className="w-4 h-4 text-[#d4580a] mb-1" />Nearest food<br /><span className="text-muted-foreground">Food row (placeholder)</span></a>
            <a href="#map" className="bg-secondary rounded-lg p-3"><Info className="w-4 h-4 text-[#d4580a] mb-1" />Info booth<br /><span className="text-muted-foreground">Main entrance</span></a>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="bg-secondary rounded-lg p-3"><Navigation className="w-4 h-4 text-[#d4580a] mb-1" />Directions<br /><span className="text-muted-foreground">Open map</span></a>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Happening now: {(festival.schedule || []).filter(s => s.day === today).slice(0, 2).map(s => `${s.time} ${s.title}`).join(' · ') || 'Check the Schedule tab.'}</p>
          {/* TODO: replace placeholder location data with live GPS + proximity sorting */}
        </Card>
      )}

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-muted min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] flex flex-col justify-end">
        <div className="absolute inset-0">
          {festival.image ? <img src={festival.image} alt={festival.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-bold text-5xl">{festival.name?.charAt(0)}</div>}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="relative z-10 p-4 sm:p-6 text-white">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(festival.statusBadges || []).map(b => <span key={b} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm">{b}</span>)}
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${festival.admission.type === 'free' ? 'bg-green-500 text-white' : 'bg-white/20'}`}>{festival.admission.type === 'free' ? 'Free' : festival.admission.price}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold break-words">{festival.name}</h1>
          <div className="flex items-center gap-x-3 gap-y-1 mt-2 text-sm flex-wrap">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{fmtRange(festival)}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{festival.hours}</span>
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{festival.neighborhood}</span>
          </div>
          <p className="text-sm mt-2 max-w-2xl text-white/90 line-clamp-2">{festival.description}</p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <Link to={`/festivals/${festival.slug}/edit`} className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold border border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10 hover:bg-[#d4580a]/20 transition-colors">
            <Pencil className="w-4 h-4" />Edit Festival
          </Link>
        )}
        <SaveButton slug={festival.slug} />
        {festival.isUserCreated && festival.id
          ? <FollowButton targetType="festival" targetId={festival.id} targetName={festival.name} />
          : <ActionBtn icon={Heart} label={isFollowing ? 'Following' : 'Follow'} active={isFollowing} onClick={() => followed.toggle(festival.slug)} />}
        <ShareButton url={`/festivals/${festival.slug}`} title={festival.name} description={festival.description} />
        <AddToCalendarButton festival={festival} />
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
          <ActionBtn icon={Navigation} label="Directions" onClick={() => {}} />
        </a>
        {festival.admission.type === 'free'
          ? <ActionBtn icon={Ticket} label="View Festival Details" onClick={() => setTab('overview')} primary className="w-full sm:w-auto" />
          : (festival.admission.url
            ? <a href={festival.admission.url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto"><ActionBtn icon={Ticket} label="Buy Tickets" onClick={() => {}} primary className="w-full sm:w-auto" /></a>
            : <ActionBtn icon={Ticket} label="Buy Tickets" onClick={() => {}} primary className="w-full sm:w-auto" />)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {(festival.tags || []).map(t => <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">{t}</span>)}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-secondary/50 rounded-xl p-1 h-auto flex overflow-x-auto scrollbar-hide gap-0.5 justify-start">
          {['overview', 'schedule', 'map', 'artists', 'vendors', 'food', 'visit', 'gallery', 'updates', 'faq'].map(t => (
            <TabsTrigger key={t} value={t} className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3 capitalize">{t === 'visit' ? 'Plan Your Visit' : t === 'food' ? 'Food + Drink' : t}</TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-5 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <SectionTitle icon={Sparkles}>About the Festival</SectionTitle>
                <p className="text-sm text-foreground/80 leading-relaxed">{festival.longDescription || festival.description}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  {festival.expectedAttendance && <div><p className="text-xs text-muted-foreground">Expected Attendance</p><p className="font-medium">{festival.expectedAttendance}</p></div>}
                  {festival.footprint && <div><p className="text-xs text-muted-foreground">Festival Footprint</p><p className="font-medium">{festival.footprint}</p></div>}
                  {festival.organizer?.name && <div><p className="text-xs text-muted-foreground">Organizer</p><p className="font-medium">{festival.organizer.name}</p></div>}
                  {festival.social?.website && <div><p className="text-xs text-muted-foreground">Website</p><a href={festival.social.website} target="_blank" rel="noopener noreferrer" className="font-medium text-[#d4580a] hover:underline flex items-center gap-1"><Globe className="w-3 h-3" />Visit</a></div>}
                </div>
              </Card>

              {festival.experiences?.length > 0 && (
                <div>
                  <SectionTitle icon={Palette}>Featured Experiences</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {festival.experiences.map(e => (
                      <div key={e.title} className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="h-20 overflow-hidden bg-muted"><img src={e.image} alt={e.title} className="w-full h-full object-cover" /></div>
                        <div className="p-2"><p className="font-semibold text-sm text-foreground">{e.title}</p><p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Card>
                <SectionTitle icon={Star}>Festival Highlights</SectionTitle>
                <div className="space-y-3 text-sm">
                  {Object.entries(festival.highlights || {}).filter(([, v]) => v?.length).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">{k}</p>
                      <ul className="list-disc list-inside text-foreground/80 mt-0.5">{v.map(x => <li key={x}>{x}</li>)}</ul>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <SectionTitle>At a Glance</SectionTitle>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Dates', fmtRange(festival)], ['Hours', festival.hours], ['Price', festival.admission.type === 'free' ? 'Free' : festival.admission.price],
                    ['Neighborhood', festival.neighborhood], ['Age', festival.ageRestriction], ['Format', festival.format],
                    ['Accessibility', Object.entries(festival.accessibility).filter(([, v]) => v).map(([k]) => k).join(', ') || 'Contact organizer'],
                    ['Rain or Shine', festival.rainOrShine ? 'Yes' : 'No'], ['Pet Policy', festival.petPolicy],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 border-b border-border last:border-0 pb-1.5 last:pb-0">
                      <dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card>
                <SectionTitle icon={Users}>Organizer</SectionTitle>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent font-bold flex items-center justify-center">{festival.organizer?.name?.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{festival.organizer?.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{festival.organizer?.description}</p>
                  </div>
                </div>
                {/* TODO: link to Planet Baltimore ArtsOrganization profile via festival.organizer.artsOrgId */}
                {festival.organizer?.website && <a href={festival.organizer.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#d4580a] hover:underline mt-2 inline-block">View Organization →</a>}
              </Card>
            </div>
          </div>

          {Object.values(festival.nearby || {}).some(v => v?.length) && (
            <Card>
              <SectionTitle icon={MapPin}>Nearby on Planet Baltimore</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {Object.entries(festival.nearby).filter(([, v]) => v?.length).map(([k, v]) => (
                  <div key={k}><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize mb-1">{k}</p><ul className="space-y-0.5">{v.map(x => <li key={x} className="text-foreground/80">{x}</li>)}</ul></div>
                ))}
              </div>
              {/* TODO: pull nearby places from Planet Baltimore BusinessPage / ArtsOrganization entities */}
            </Card>
          )}
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {days.map(d => (
              <button key={d} onClick={() => setActiveDay(d)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeDay === d ? 'bg-[#d4580a] text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
                {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={schedSearch} onChange={e => setSchedSearch(e.target.value)} placeholder="Search schedule…" className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/50 border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {featuredExtras.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[#d4580a]" />Featured at the Festival</p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {featuredExtras.map((f, i) => (
                  <div key={i} className="flex-shrink-0 w-56 bg-card border border-[#d4580a]/30 rounded-xl p-3">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#d4580a]/15 text-[#d4580a] capitalize">{f.category}</span>
                    <p className="font-semibold text-sm text-foreground mt-1.5">{f.title}</p>
                    {f.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{f.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {scheduleForDay.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">No schedule items match. Full schedule connects here when live data is ready.</p>
          ) : (
            <div className="space-y-2">
              {scheduleForDay.map((s, i) => {
                const id = `${s.day}-${s.time}-${s.title}`;
                const Icon = CAT_ICON[s.category] || (s._source === 'artist' ? Music : Music);
                return (
                  <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-start gap-3">
                    <div className="w-14 flex-shrink-0 text-center">
                      <p className="text-xs font-bold text-[#d4580a]">{s.time.split(' ')[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{s.time.split(' ')[1]}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{s.title}</p>
                      {s.artist && <p className="text-xs text-muted-foreground">{s.artist}</p>}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        {s.stage && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.stage}</span>}
                        <span className="flex items-center gap-1 capitalize"><Icon className="w-3 h-3" />{s.category}</span>
                      </div>
                      {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <MiniSave id={id} label="My Schedule" />
                      <button className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary"><CalendarPlus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Map */}
        <TabsContent value="map" className="mt-5" id="map">
          <div className="rounded-xl overflow-hidden border border-border" style={{ height: 400 }}>
            <MapContainer center={[festival.coordinates?.lat || 39.3, festival.coordinates?.lng || -76.62]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[festival.coordinates?.lat || 39.3, festival.coordinates?.lng || -76.62]}>
                <Popup><strong>{festival.name}</strong><br />{festival.venue}<br /><a href={directionsUrl} target="_blank" rel="noopener noreferrer">Directions →</a></Popup>
              </Marker>
            </MapContainer>
          </div>
          {/* TODO: detailed festival footprint with pins for stages, food, restrooms, info, etc. + legend + "You Are Here" */}
          <Card className="mt-4">
            <SectionTitle icon={MapPin}>Festival Map Legend</SectionTitle>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Stages', 'Food', 'Vendors', 'Restrooms', 'Info', 'First Aid', 'Parking', 'Entrances'].map(l => (
                <span key={l} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground"><MapPin className="w-3 h-3 text-[#d4580a]" />{l}</span>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Artists */}
        <TabsContent value="artists" className="mt-5 space-y-4">
          {(festival.artists || []).length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Artist lineup will appear here.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {festival.artists.map((a, i) => {
                const dayLabel = a.day && new Date(a.day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                const metaLabel = [dayLabel, a.time, a.stage].filter(Boolean).join(' · ');
                return (
                  <div key={i} className="group bg-card border border-border rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5">
                    <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-accent/20 to-accent/5">
                      {a.image ? (
                        <img src={a.image} alt={a.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-accent/40 font-black text-6xl">{a.name?.charAt(0) || '?'}</div>
                      )}
                      {a.discipline && (
                        <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/55 text-white backdrop-blur-sm capitalize">{a.discipline}</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white font-bold text-lg leading-tight drop-shadow">{a.name}</p>
                      </div>
                    </div>
                    {(metaLabel || a.bio) && (
                      <div className="p-3 flex-1 flex flex-col">
                        {metaLabel && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Calendar className="w-3 h-3" />{metaLabel}</p>}
                        {a.bio && <p className="text-sm text-foreground/80 line-clamp-3">{a.bio}</p>}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                          <MiniSave id={`artist-${a.name}`} label="" />
                          <button
                            onClick={() => setShareArtist({
                              title: `${a.name} at ${festival.name}`,
                              url: `${window.location.origin}/festivals/${festival.slug}#artists`,
                              description: a.bio || festival.description,
                            })}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />Share
                          </button>
                          {a.profileId && <Link to={`/artists/${a.profileId}`} className="text-xs text-[#d4580a] hover:underline font-medium ml-auto">View Profile →</Link>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Vendors */}
        <TabsContent value="vendors" className="mt-5 space-y-4">
          {(festival.vendors || []).length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Vendor list will appear here.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {festival.vendors.map((v, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3">
                  <p className="font-semibold text-foreground text-sm">{v.name}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{v.category}</span>
                  {v.booth && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Booth {v.booth}</p>}
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <MiniSave id={`vendor-${v.name}`} label="" />
                    {v.website && <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-xs text-[#d4580a] hover:underline">Website →</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Food + Drink */}
        <TabsContent value="food" className="mt-5 space-y-4" id="food">
          {(festival.foodVendors || []).length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Food vendor list will appear here.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {festival.foodVendors.map((v, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-foreground text-sm">{v.name}</p>
                    <span className="text-xs font-medium text-muted-foreground">{v.priceRange}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{v.cuisine}</span>
                  {v.menuHighlights?.length > 0 && <p className="text-xs text-muted-foreground mt-1">Menu: {v.menuHighlights.join(', ')}</p>}
                  {v.booth && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{v.booth}</p>}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {v.dietary?.map(d => <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600">{d}</span>)}
                    {v.alcohol && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">Beer/Wine</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Plan Your Visit */}
        <TabsContent value="visit" className="mt-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <SectionTitle icon={Bus}>Getting There</SectionTitle>
              <dl className="space-y-1.5 text-sm">
                <div><dt className="text-muted-foreground text-xs">Light Rail</dt><dd>{festival.transportation?.lightRail}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Metro</dt><dd>{festival.transportation?.metro}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Bus</dt><dd>{festival.transportation?.bus}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Rideshare</dt><dd>{festival.transportation?.rideshare}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Bike Parking</dt><dd>{festival.transportation?.bikeParking}</dd></div>
              </dl>
            </Card>
            <Card>
              <SectionTitle icon={Car}>Parking</SectionTitle>
              <p className="text-sm text-foreground/80">{festival.parking?.notes}</p>
              {festival.parking?.garages?.length > 0 && (
                <ul className="mt-2 space-y-1 text-sm">{festival.parking.garages.map(g => <li key={g.name} className="flex justify-between"><span>{g.name}</span><span className="text-muted-foreground">{g.cost}</span></li>)}</ul>
              )}
            </Card>
          </div>

          <Card>
            <SectionTitle icon={AlertTriangle}>Street Closures</SectionTitle>
            <p className="text-sm text-muted-foreground">Street closure and traffic alert information will appear here closer to the festival date. {/* TODO: connect to live city traffic feed */}</p>
          </Card>

          <Card>
            <SectionTitle icon={Accessibility}>Accessibility</SectionTitle>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {Object.entries(festival.accessibility).filter(([, v]) => v).map(([k]) => (
                <span key={k} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Check}>What to Bring</SectionTitle>
            <ul className="grid grid-cols-2 gap-1 text-sm text-foreground/80 list-disc list-inside">
              <li>Reusable water bottle</li><li>Comfortable shoes</li><li>Sunscreen</li><li>Weather protection</li><li>ID if required</li><li>Cash + card</li>
            </ul>
          </Card>

          <Card>
            <SectionTitle icon={Shield}>Festival Rules</SectionTitle>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {Object.entries(festival.rules || {}).map(([k, v]) => (
                <div key={k} className="flex gap-2"><dt className="text-muted-foreground capitalize w-24 flex-shrink-0">{k}:</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </Card>

          <Card>
            <SectionTitle icon={CloudSun}>Weather</SectionTitle>
            <p className="text-sm text-muted-foreground">Weather forecast will appear here closer to the festival. {/* TODO: connect to weather API */}</p>
          </Card>
        </TabsContent>

        {/* Gallery */}
        <TabsContent value="gallery" className="mt-5">
          {(festival.gallery?.photos || []).length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">Gallery photos will appear here.</p>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [&>*]:mb-3">
              {festival.gallery.photos.map((src, i) => (
                <img key={i} src={src} alt={`${festival.name} ${i + 1}`} className="w-full rounded-xl break-inside-avoid" loading="lazy" />
              ))}
            </div>
          )}
          {/* TODO: video gallery, past years, user-submitted images, media coverage */}
        </TabsContent>

        {/* Updates */}
        <TabsContent value="updates" className="mt-5 space-y-3">
          {(festival.updates || []).length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground">No updates yet. Organizers will post schedule changes, weather alerts, and announcements here.</p>
          ) : (
            [...festival.updates].reverse().map((u, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${/emergency|alert/i.test(u.type) ? 'bg-red-500/15 text-red-600' : 'bg-[#d4580a]/15 text-[#d4580a]'}`}>{u.type}</span>
                  <span className="text-xs text-muted-foreground">{u.timestamp}</span>
                </div>
                <p className="text-sm text-foreground mt-1.5">{u.message}</p>
                <div className="mt-2"><ShareButton url={`/festivals/${festival.slug}`} title={`${festival.name} update`} /></div>
              </div>
            ))
          )}
          {canManage && (
            <FestivalUpdateComposer festival={festival} onUpdated={setFestival} />
          )}
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq" className="mt-5">
          <Card>
            <SectionTitle icon={BookOpen}>Frequently Asked Questions</SectionTitle>
            <Accordion type="single" collapsible className="w-full">
              {(festival.faq || []).map((item, i) => (
                <AccordionItem key={i} value={`q-${i}`}>
                  <AccordionTrigger className="text-sm font-medium text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </TabsContent>
      </Tabs>

      <ShareModal
        isOpen={!!shareArtist}
        onClose={() => setShareArtist(null)}
        url={shareArtist?.url}
        title={shareArtist?.title}
        description={shareArtist?.description}
      />

      <div className="text-center pt-4">
        <Link to="/festivals" className="text-sm text-[#d4580a] font-medium hover:underline">← Back to all festivals</Link>
      </div>
    </div>
  );
}