import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function SuggestionSection({ title, icon: Icon, items, type, badgeLabel, isTrending }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: isTrending ? '#d4580a' : 'var(--accent)' }} />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
        </div>
        {badgeLabel && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{badgeLabel}</Badge>}
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <Link key={idx} to={item.link || '#'} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/60 active:bg-secondary transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="w-9 h-9 rounded-lg flex-shrink-0">
              <AvatarImage src={item.image} />
              <AvatarFallback className="rounded-lg bg-accent/10 text-accent text-xs font-bold">
                {item.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
            </div>
            {item.tag && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium whitespace-nowrap">{item.tag}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

const suggestedZines = [
  { name: 'The Baltimore Art Revival', subtitle: 'By Maya Johnson', image: '', tag: 'For You', link: '/stories' },
  { name: 'Hidden Gems: Remington', subtitle: 'Neighborhood Guide', image: '', tag: 'Explore', link: '/stories' },
];

const suggestedArtists = [
  { name: 'Khalil Thompson', subtitle: 'Visual Artist · Station North', image: '', tag: 'Match', link: '/artists' },
  { name: 'Luna Vega', subtitle: 'Musician · Hampden', image: '', tag: 'New', link: '/artists' },
];

const suggestedEvents = [
  { name: 'First Friday Art Walk', subtitle: 'Fri, 6 PM · Station North', image: '', tag: 'Trending', link: '/ticketing' },
  { name: 'Harbor Cleanup Day', subtitle: 'Sat, 9 AM · Inner Harbor', image: '', tag: 'Try New', link: '/ticketing' },
];

const suggestedPeople = [
  { name: 'DeAndre Williams', subtitle: 'Pigtown · Community Leader', image: '', link: '#' },
  { name: 'Sarah Chen', subtitle: 'Canton · Event Producer', image: '', link: '#' },
];

export default function RightSidebar() {
  return (
    <aside className="hidden xl:block fixed right-0 top-0 h-screen w-[19%] min-w-[240px] bg-card border-l border-border overflow-y-auto z-30">
      <div className="p-4 sm:p-5 pt-20 sm:pt-24 space-y-5">
        <SuggestionSection title="Trending Stories" icon={TrendingUp} items={suggestedZines} badgeLabel="50% For You" isTrending />
        <SuggestionSection title="Artists to Follow" icon={Sparkles} items={suggestedArtists} badgeLabel="50% Discover" isTrending />
        <SuggestionSection title="Upcoming Events" icon={MapPin} items={suggestedEvents} isTrending />
        <SuggestionSection title="People Nearby" icon={Sparkles} items={suggestedPeople} isTrending />
        
        <div className="pt-4 border-t border-border">
          <Link to="/discover" className="flex items-center gap-2 text-sm text-accent hover:text-accent/80 font-medium transition-all duration-150 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-0.5">
            Explore more of Baltimore
            <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        </div>
        
        <p className="text-[11px] text-muted-foreground/60">© 2026 BMore Connected</p>
      </div>
    </aside>
  );
}