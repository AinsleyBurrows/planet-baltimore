import React from 'react';
import { X, Ticket, CalendarPlus, MapPin, Calendar, Clock } from 'lucide-react';

export default function HeadlinerModal({ headliner, festival, ticketTypes, onClose, onRSVP, onBuyTickets }) {
  if (!headliner) return null;
  const dayLabel = headliner.day ? new Date(headliner.day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : '';
  const meta = [dayLabel, headliner.time, headliner.stage].filter(Boolean).join(' · ');
  const tt = ticketTypes.find((t) => t.id === headliner.ticket_type_id);
  const priceLabel = tt
    ? (tt.price === 0 ? 'Free' : `$${tt.price}`)
    : (festival?.admission?.type === 'free' ? 'Free' : festival?.admission?.price || '—');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-card border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Hero image */}
        <div className="relative h-60 sm:h-64 bg-muted">
          {headliner.image ? (
            <img src={headliner.image} alt={headliner.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent/10 text-accent font-black text-7xl">{headliner.name?.charAt(0) || '?'}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <p className="font-bold text-2xl leading-tight drop-shadow">{headliner.name}</p>
            {meta && (
              <p className="text-sm text-white/85 mt-1 flex items-center gap-1.5 flex-wrap">
                {headliner.day && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{dayLabel}</span>}
                {headliner.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{headliner.time}</span>}
                {headliner.stage && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{headliner.stage}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {headliner.bio && <p className="text-sm text-foreground/80 leading-relaxed">{headliner.bio}</p>}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Admission</span>
            <span className="font-semibold text-foreground">{priceLabel}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRSVP}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold border border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10 hover:bg-[#d4580a]/20 transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />RSVP
            </button>
            <button
              onClick={onBuyTickets}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#d4580a' }}
            >
              <Ticket className="w-4 h-4" />Buy Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}