import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Sparkles, MapPin, ArrowRight, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

function SuggestionSection({ title, icon: Icon, children, seeAllLink }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        </div>
        {seeAllLink && (
          <Link to={seeAllLink} className="text-[11px] font-medium" style={{ color: '#d4580a' }}>See all</Link>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default function RightSidebar() {
  const { data: stories = [] } = useQuery({
    queryKey: ['sidebar-stories'],
    queryFn: () => base44.entities.Story.filter({ status: 'published', visibility: 'public' }, '-views_count', 5),
    staleTime: 300000,
  });

  const { data: artists = [] } = useQuery({
    queryKey: ['sidebar-artists'],
    queryFn: () => base44.entities.ArtistPage.list('-created_date', 5),
    staleTime: 300000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['sidebar-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'upcoming' }, 'date', 5),
    staleTime: 300000,
  });

  return (
    <aside className="hidden xl:block fixed right-0 top-0 h-screen w-[19%] min-w-[240px] bg-card border-l border-border overflow-y-auto z-30">
      <div className="p-4 sm:p-5 pt-20 sm:pt-24 space-y-5">

        {stories.length > 0 && (
          <SuggestionSection title="Trending Stories" icon={TrendingUp} seeAllLink="/stories">
            {stories.map((s) => (
              <Link key={s.id} to={`/stories/${s.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 active:bg-secondary transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="w-9 h-9 rounded-lg flex-shrink-0">
                  <AvatarImage src={s.cover_image} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg bg-accent/10 text-accent text-xs font-bold">{s.title?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-[#d4580a] transition-colors">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">by {s.author_name}</p>
                </div>
              </Link>
            ))}
          </SuggestionSection>
        )}

        {artists.length > 0 && (
          <SuggestionSection title="Artists to Follow" icon={Sparkles} seeAllLink="/artists">
            {artists.map((a) => (
              <Link key={a.id} to={`/artists/${a.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 active:bg-secondary transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="w-9 h-9 rounded-lg flex-shrink-0">
                  <AvatarImage src={a.image_url} />
                  <AvatarFallback className="rounded-lg bg-accent/10 text-accent text-xs font-bold">{a.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-[#d4580a] transition-colors">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{a.category?.replace('_', ' ')}{a.neighborhood_name ? ` · ${a.neighborhood_name}` : ''}</p>
                </div>
              </Link>
            ))}
          </SuggestionSection>
        )}

        {events.length > 0 && (
          <SuggestionSection title="Upcoming Events" icon={Calendar} seeAllLink="/ticketing">
            {events.map((e) => (
              <Link key={e.id} to={`/events/${e.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 active:bg-secondary transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="w-9 h-9 rounded-lg flex-shrink-0">
                  <AvatarImage src={e.image_url} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg bg-accent/10 text-accent text-xs font-bold">{e.title?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-[#d4580a] transition-colors">{e.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{e.date ? format(new Date(e.date), 'MMM d') : ''}{e.venue_name ? ` · ${e.venue_name}` : ''}</p>
                </div>
              </Link>
            ))}
          </SuggestionSection>
        )}

        <div className="pt-4 border-t border-border">
          <Link to="/discover" className="flex items-center gap-2 text-sm font-medium transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-0.5" style={{ color: '#d4580a' }}>
            Explore more of Baltimore
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground/60">© 2026 Planet Baltimore</p>
      </div>
    </aside>
  );
}