import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import SaveButton from './SaveButton';
import ShareButton from './ShareButton';
import AddToCalendarButton from './AddToCalendarButton';

function formatDateRange(f) {
  const opts = { month: 'short', day: 'numeric' };
  const s = new Date(f.startDate).toLocaleDateString('en-US', opts);
  if (!f.endDate || f.endDate === f.startDate) return s;
  const e = new Date(f.endDate).toLocaleDateString('en-US', opts);
  return `${s} – ${e}`;
}

const STATUS_STYLES = {
  'Happening Today': 'bg-green-500/15 text-green-600',
  'This Weekend': 'bg-[#d4580a]/15 text-[#d4580a]',
  'Free': 'bg-green-500/15 text-green-600',
  'Selling Fast': 'bg-red-500/15 text-red-600',
  'Newly Added': 'bg-blue-500/15 text-blue-600',
  'Family Friendly': 'bg-purple-500/15 text-purple-600',
  'Outdoor': 'bg-teal-500/15 text-teal-600',
  '21+': 'bg-amber-500/15 text-amber-600',
  'Ticketed': 'bg-indigo-500/15 text-indigo-600',
  'Donation-Based': 'bg-cyan-500/15 text-cyan-600',
};

export default function FestivalCard({ festival }) {
  return (
    <Link
      to={`/festivals/${festival.slug}`}
      className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-40 overflow-hidden bg-muted">
        {festival.image
          ? <img src={festival.image} alt={festival.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-bold text-2xl">{festival.name?.charAt(0)}</div>}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {(festival.statusBadges || []).slice(0, 3).map(b => (
            <span key={b} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[b] || 'bg-secondary text-muted-foreground'}`}>{b}</span>
          ))}
        </div>
        <div className="absolute bottom-2 right-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${festival.admission.type === 'free' ? 'bg-green-500 text-white' : 'bg-foreground text-background'}`}>
            {festival.admission.type === 'free' ? 'FREE' : festival.admission.price}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">{festival.name}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateRange(festival)}</span>
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{festival.neighborhood}</span>
        </div>
        {festival.venue && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{festival.hours}</p>}
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">{festival.description}</p>

        <div className="flex flex-wrap gap-1 mt-2">
          {(festival.categories || []).slice(0, 3).map(c => (
            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{c.replace(/_/g, ' ')}</span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
          <SaveButton slug={festival.slug} />
          <ShareButton url={`/festivals/${festival.slug}`} title={festival.name} />
          <AddToCalendarButton festival={festival} />
          <span className="ml-auto flex items-center gap-1 text-xs font-medium text-[#d4580a] group-hover:underline">
            <Ticket className="w-3.5 h-3.5" />View
          </span>
        </div>
      </div>
    </Link>
  );
}