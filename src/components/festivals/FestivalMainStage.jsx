import React, { useState, useMemo } from 'react';
import { Music, Clock, Star, Headphones, Disc3 } from 'lucide-react';

// Sample main stage lineup — keyed to the Artscape festival footprint.
// Each act: { day (1-3), start, end, artist, genre, is_headliner }
const LINEUP = [
  { day: 1, start: '12:00', end: '13:00', artist: 'Sola Ekunseitan', genre: 'Afro-Soul', is_headliner: false },
  { day: 1, start: '13:30', end: '14:45', artist: 'On Repeat Live Band', genre: 'Indie/Soul', is_headliner: false },
  { day: 1, start: '15:15', end: '16:30', artist: 'Khateeta Sound System', genre: 'DJ / Electronic', is_headliner: false },
  { day: 1, start: '17:00', end: '18:30', artist: 'Kwame Alston Quintet', genre: 'Jazz', is_headliner: true },
  { day: 2, start: '12:30', end: '13:30', artist: 'Ada Pinkston Collective', genre: 'Spoken Word / Experimental', is_headliner: false },
  { day: 2, start: '14:00', end: '15:30', artist: 'The Treasure Box Revue', genre: 'Soul / R&B', is_headliner: false },
  { day: 2, start: '16:00', end: '17:15', artist: 'Dalmar Starliner', genre: 'Hip-Hop', is_headliner: false },
  { day: 2, start: '18:00', end: '19:45', artist: 'Laurielle Noel', genre: 'Neo-Soul', is_headliner: true },
  { day: 3, start: '12:00', end: '13:15', artist: 'Henry Noel Trio', genre: 'Funk', is_headliner: false },
  { day: 3, start: '13:45', end: '15:00', artist: 'Juliette-Isha Noel', genre: 'Pop / Folk', is_headliner: false },
  { day: 3, start: '15:30', end: '16:45', artist: 'nk / Quid-Nunc', genre: 'Ambient', is_headliner: false },
  { day: 3, start: '17:15', end: '19:00', artist: 'Ainsley Burrows & Friends', genre: 'Closing Showcase', is_headliner: true },
];

const DAY_LABELS = [
  { day: 1, label: 'Fri · July 17' },
  { day: 2, label: 'Sat · July 18' },
  { day: 3, label: 'Sun · July 19' },
];

export default function FestivalMainStage() {
  const [selectedDay, setSelectedDay] = useState(1);

  const acts = useMemo(
    () => LINEUP.filter(a => a.day === selectedDay).sort((a, b) => a.start.localeCompare(b.start)),
    [selectedDay]
  );

  const headlinerCount = acts.filter(a => a.is_headliner).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-primary text-accent-foreground p-5 sm:p-6">
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Headphones className="w-32 h-32" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide opacity-90 mb-1">
            <Disc3 className="w-4 h-4" />
            <span>Artscape Main Stage</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold leading-tight">Main Stage Lineup</h2>
          <p className="text-sm opacity-80 mt-1 max-w-md">
            Three days of headliners, local legends, and rising talent. All main stage sets are free and open to all festival attendees.
          </p>
        </div>
      </div>

      {/* Day selector */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {DAY_LABELS.map(({ day, label }) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              selectedDay === day
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lineup timeline */}
      <div className="relative">
        <div className="absolute left-[52px] sm:left-[60px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-3">
          {acts.map((act, i) => {
            const Icon = act.is_headliner ? Star : Music;
            return (
              <div
                key={i}
                className={`relative flex items-center gap-3 sm:gap-4 bg-card border rounded-xl p-3 sm:p-4 ${
                  act.is_headliner ? 'border-gold/40 shadow-sm' : 'border-border'
                }`}
              >
                {/* Time block */}
                <div className="flex-shrink-0 w-12 sm:w-14 text-center pl-1">
                  <p className="text-sm font-bold text-foreground leading-none">{act.start}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{act.end}</p>
                </div>

                {/* Timeline node */}
                <div
                  className={`relative z-10 flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
                    act.is_headliner ? 'bg-gold text-white' : 'bg-accent/10 text-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {/* Act details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{act.artist}</h3>
                    {act.is_headliner && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gold text-white">
                        Headliner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{act.genre}</p>
                </div>

                {/* Duration */}
                <div className="flex-shrink-0 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {act.start}–{act.end}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footnote */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
        <Star className="w-3.5 h-3.5 text-gold" />
        {headlinerCount} headliner{headlinerCount !== 1 ? 's' : ''} on this day · Schedule subject to change.
      </p>
    </div>
  );
}