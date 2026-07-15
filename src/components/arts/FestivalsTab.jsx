import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Sparkles, Palette, Landmark, Shield, MapPin, Search } from 'lucide-react';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const SUB_TABS = [
  { key: 'festivals', label: 'Festivals' },
  { key: 'scout', label: 'Scout Art Fair' },
  { key: 'flavor_lab', label: 'The Flavor Lab', tag: 'flavor_lab', description: 'A culinary experience celebrating Baltimore\'s food scene — tastings, chef demos, and local flavor.' },
  { key: 'artisan_market', label: 'Artisan Market', tag: 'artisan_market', description: 'Handmade goods from regional makers, craftspeople, and small-batch producers.' },
  { key: 'sondheim', label: 'Sondheim Prize', tag: 'sondheim', description: 'The Janet & Walter Sondheim Artscape Prize — recognizing the region\'s top visual artists.' },
  { key: 'conversation', label: 'In Conversation Series', tag: 'conversation', description: 'Talks and dialogues with artists, curators, and cultural leaders shaping the conversation.' },
  { key: 'beyond_reel', label: 'Beyond the Reel', tag: 'beyond_reel', description: 'Film screenings, premieres, and filmmaker Q&As spotlighting independent cinema.' },
  { key: 'kidscape', label: 'Kidscape', tag: 'kidscape', description: 'Family-friendly art-making, performances, and activities for young creatives.' },
  { key: 'after_dark', label: 'Artscape After Dark', tag: 'after_dark', description: 'Late-night programming — music, performances, and nightlife across the festival.' },
  { key: 'main_stage', label: 'Main Stage', tag: 'main_stage', description: 'The festival\'s headline stage — marquee performances and main attractions.' },
  { key: 'echo_stages', label: 'Echo Stages', tag: 'echo_stages', description: 'Secondary stages spotlighting emerging and local talent. Admins can assign events to Echo Stage 1 or Echo Stage 2.' },
];

function FestivalProgram({ tab, events, isLoading }) {
  if (!tab) return null;
  const now = new Date();
  const matched = (events || []).filter(e => {
    const ended = (e.end_date ? new Date(e.end_date) : new Date(e.date)) < now;
    return !ended && (e.tags || []).some(t => t.toLowerCase() === tab.tag);
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-5 bg-card">
        <h2 className="text-xl font-bold text-foreground mb-1">{tab.label}</h2>
        {tab.description && <p className="text-sm text-muted-foreground max-w-2xl">{tab.description}</p>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : matched.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No {tab.label} events yet</h3>
          <p className="text-sm text-muted-foreground">Tag a festival event with "{tab.tag}" to feature it here.</p>
          <Link to="/create-event" className="inline-block mt-4">
            <Button variant="outline" className="gap-2 rounded-lg" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matched.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}

export default function FestivalsTab() {
  const [section, setSection] = useState('festivals');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['festivals'],
    queryFn: () => base44.entities.Event.filter({ category: 'festival' }, 'date', 100),
    staleTime: 120000,
  });

  const now = new Date();
  const filtered = events.filter(e => {
    const ended = (e.end_date ? new Date(e.end_date) : new Date(e.date)) < now;
    return !ended && (!search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.description?.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setSection(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${section === t.key ? 'bg-card text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground bg-secondary/40'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === 'scout' ? (
        <ScoutArtFair />
      ) : section === 'festivals' ? (
        <>
          {/* Search */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search festivals..."
              className="pl-9 rounded-xl bg-secondary/50 border-0"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No festivals yet</h3>
              <p className="text-sm text-muted-foreground">Create a festival event to feature it here.</p>
              <Link to="/create-event" className="inline-block mt-4">
                <Button variant="outline" className="gap-2 rounded-lg" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
                  <Plus className="w-4 h-4" /> Create Event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(event => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </>
      ) : section === 'echo_stages' ? (
        <EchoStages events={events} isLoading={isLoading} />
      ) : (
        <FestivalProgram tab={SUB_TABS.find(t => t.key === section)} events={events} isLoading={isLoading} />
      )}
    </div>
  );
}

function EchoStages({ events, isLoading }) {
  const [stage, setStage] = useState('echo_stage_1');
  const now = new Date();
  const matched = (events || []).filter(e => {
    const ended = (e.end_date ? new Date(e.end_date) : new Date(e.date)) < now;
    return !ended && (e.tags || []).some(t => t.toLowerCase() === stage);
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-5 bg-card">
        <h2 className="text-xl font-bold text-foreground mb-1">Echo Stages</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">Secondary stages spotlighting emerging and local talent. Use the picker to view each stage.</p>
      </div>

      {/* Stage picker */}
      <div className="flex gap-1 p-1 bg-secondary/60 rounded-xl w-fit">
        <button
          onClick={() => setStage('echo_stage_1')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${stage === 'echo_stage_1' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Echo Stage 1
        </button>
        <button
          onClick={() => setStage('echo_stage_2')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${stage === 'echo_stage_2' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Echo Stage 2
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : matched.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No events on {stage === 'echo_stage_1' ? 'Echo Stage 1' : 'Echo Stage 2'} yet</h3>
          <p className="text-sm text-muted-foreground">Tag a festival event with "{stage}" to assign it to this stage.</p>
          <Link to="/create-event" className="inline-block mt-4">
            <Button variant="outline" className="gap-2 rounded-lg" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {matched.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </div>
  );
}

function ScoutArtFair() {
  const [picker, setPicker] = useState('artists');
  const [search, setSearch] = useState('');

  const { data: artists = [], isLoading: loadingArtists } = useQuery({
    queryKey: ['scout-artists'],
    queryFn: () => base44.entities.ArtistPage.list('-created_date', 100),
    enabled: picker === 'artists',
    staleTime: 120000,
  });

  const { data: galleries = [], isLoading: loadingGalleries } = useQuery({
    queryKey: ['scout-galleries'],
    queryFn: () => base44.entities.ArtsOrganization.filter({ org_type: 'gallery' }, '-created_date', 100),
    enabled: picker === 'galleries',
    staleTime: 120000,
  });

  const isLoading = picker === 'artists' ? loadingArtists : loadingGalleries;
  const allItems = picker === 'artists' ? artists : galleries;
  const items = allItems.filter(i => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (i.name?.toLowerCase().includes(q) ||
      i.bio?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      (i.tags || []).some(t => t.toLowerCase().includes(q)) ||
      i.neighborhood_name?.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5">
      {/* Picker */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 bg-secondary/60 rounded-xl w-fit">
          <button
            onClick={() => { setPicker('artists'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${picker === 'artists' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Palette className="w-4 h-4" /> Artists
          </button>
          <button
            onClick={() => { setPicker('galleries'); setSearch(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${picker === 'galleries' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Landmark className="w-4 h-4" /> Galleries
          </button>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${picker}...`}
            className="pl-9 rounded-xl bg-secondary/50 border-0"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            {picker === 'artists' ? <Palette className="w-7 h-7 text-accent" /> : <Landmark className="w-7 h-7 text-accent" />}
          </div>
          <h3 className="font-semibold text-foreground mb-1">No {picker} yet</h3>
          <p className="text-sm text-muted-foreground">Check back soon for Scout Art Fair participants.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <ScoutCard key={item.id} item={item} type={picker} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScoutCard({ item, type }) {
  const link = type === 'artists' ? `/artists/${item.id}` : `/arts-organizations/${item.id}`;
  return (
    <Link
      to={link}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="p-4 flex items-start gap-3">
        <Avatar className="w-14 h-14 rounded-xl flex-shrink-0">
          <AvatarImage src={item.image_url} />
          <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold text-lg">{item.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">{item.name}</h3>
            {item.is_verified && <Shield className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
          </div>
          {type === 'artists' ? (
            <Badge variant="secondary" className="text-xs mt-0.5 capitalize">{item.category?.replace(/_/g, ' ')}</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs mt-0.5">Gallery</Badge>
          )}
          {item.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.bio}</p>}
          {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
          {item.neighborhood_name && (
            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.neighborhood_name}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}