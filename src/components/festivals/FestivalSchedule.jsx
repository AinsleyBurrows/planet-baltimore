import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function FestivalSchedule({ festivals = [], isLoading }) {
  const [selectedDay, setSelectedDay] = useState('all');

  // Group festivals by day
  const byDay = useMemo(() => {
    const map = {};
    festivals.forEach(f => {
      if (!f.date) return;
      const key = new Date(f.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(f);
    });
    return Object.entries(map).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [festivals]);

  const days = byDay.map(([day]) => day);

  const visible = selectedDay === 'all'
    ? festivals
    : festivals.filter(f => f.date && new Date(f.date).toDateString() === selectedDay);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  if (festivals.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-border rounded-2xl">
        <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No festival schedule available yet — check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Day filter */}
      {days.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              selectedDay === 'all' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            All Days
          </button>
          {days.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                selectedDay === day ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {new Date(day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </button>
          ))}
        </div>
      )}

      {/* Schedule list */}
      <div className="space-y-3">
        {visible.map(festival => (
          <Link
            key={festival.id}
            to={`/events/${festival.id}`}
            className="flex gap-4 bg-card border border-border rounded-xl p-3 sm:p-4 interactive-card hover:border-accent/30"
          >
            {/* Date block */}
            <div className="flex-shrink-0 w-14 sm:w-16 text-center">
              <div className="bg-accent/10 rounded-lg p-2">
                <p className="text-[10px] uppercase font-medium text-accent">
                  {festival.date ? new Date(festival.date).toLocaleDateString('en-US', { month: 'short' }) : 'TBA'}
                </p>
                <p className="text-xl font-bold text-foreground">
                  {festival.date ? new Date(festival.date).getDate() : '—'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">{festival.title}</h3>
              {festival.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{festival.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {festival.date && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(festival.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
                {festival.venue_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {festival.venue_name}
                  </span>
                )}
                {festival.rsvp_count > 0 && (
                  <span className="text-accent font-medium">{festival.rsvp_count} RSVP'd</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}