import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, Ticket } from 'lucide-react';
import SaveButton from './SaveButton';
import ShareButton from './ShareButton';
import AddToCalendarButton from './AddToCalendarButton';

function formatDateRange(f) {
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  const s = new Date(f.startDate).toLocaleDateString('en-US', opts);
  if (!f.endDate || f.endDate === f.startDate) return s;
  const e = new Date(f.endDate).toLocaleDateString('en-US', opts);
  return `${s} – ${e}`;
}

export default function FeaturedFestival({ festival }) {
  if (!festival) return null;
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col lg:flex-row hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-56 lg:h-auto lg:w-1/2 overflow-hidden bg-muted">
        {festival.image
          ? <img src={festival.image} alt={festival.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-bold text-4xl">{festival.name?.charAt(0)}</div>}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {(festival.statusBadges || []).map(b => (
            <span key={b} className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-black/55 text-white backdrop-blur-sm">{b}</span>
          ))}
        </div>
      </div>
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4580a]">Featured Festival</span>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{festival.name}</h2>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDateRange(festival)}</span>
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{festival.neighborhood}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><Clock className="w-4 h-4" />{festival.hours}</p>
        <p className="text-sm text-foreground/80 mt-3 leading-relaxed line-clamp-3">{festival.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {(festival.tags || []).map(t => (
            <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{t}</span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
          <Link to={`/festivals/${festival.slug}`}>
            <button className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: '#d4580a' }}>
              <Ticket className="w-4 h-4" />Explore Festival
            </button>
          </Link>
          <Link to={`/festivals/${festival.slug}`}>
            <button className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold border border-[#d4580a] text-[#d4580a] hover:bg-[#d4580a]/10 transition-colors">
              <Calendar className="w-4 h-4" />View Schedule
            </button>
          </Link>
          <div className="flex items-center gap-1.5 ml-auto">
            <SaveButton slug={festival.slug} />
            <ShareButton url={`/festivals/${festival.slug}`} title={festival.name} />
            <AddToCalendarButton festival={festival} />
          </div>
        </div>
      </div>
    </div>
  );
}