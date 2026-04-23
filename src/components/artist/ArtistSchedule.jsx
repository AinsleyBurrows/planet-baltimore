import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Ticket, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isTomorrow, isFuture } from 'date-fns';

function dateLabel(dateStr) {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

export default function ArtistSchedule({ events = [] }) {
  const upcoming = events
    .filter(e => e.date && (isToday(new Date(e.date)) || isFuture(new Date(e.date))))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (upcoming.length === 0) {
    return (
      <div className="text-center py-14">
        <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
          <Calendar className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map(event => {
        const d = new Date(event.date);
        const label = dateLabel(event.date);
        const isNear = label === 'Today' || label === 'Tomorrow';

        return (
          <Link
            key={event.id}
            to={`/events/${event.id}`}
            className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:shadow-md hover:border-accent/30 transition-all group"
          >
            {/* Date block */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center ${isNear ? 'bg-accent text-accent-foreground' : 'bg-secondary text-foreground'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                {format(d, 'MMM')}
              </span>
              <span className="text-xl font-bold leading-tight">{format(d, 'd')}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1 text-sm">
                  {event.title}
                </h3>
                {isNear && (
                  <Badge className="bg-accent/10 text-accent border-0 text-[10px] flex-shrink-0">{label}</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{format(d, 'h:mm a')}
                </span>
                {(event.venue_name || event.neighborhood_name) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{event.venue_name || event.neighborhood_name}</span>
                  </span>
                )}
                {event.is_free ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                ) : event.price_range ? (
                  <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{event.price_range}</span>
                ) : null}
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      })}
    </div>
  );
}