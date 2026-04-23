import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import AppImage from './AppImage';
import InlineRSVP from '@/components/events/InlineRSVP';

export default function EventCard({ event, compact = false }) {
  const eventDate = event.date ? new Date(event.date) : null;

  if (compact) {
    return (
      <Link to={`/events/${event.id}`} className="flex gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-sm transition-all group">
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-accent/10 flex flex-col items-center justify-center">
          {eventDate ? (
            <>
              <span className="text-xs font-bold text-accent uppercase">{format(eventDate, 'MMM')}</span>
              <span className="text-lg font-bold text-foreground">{format(eventDate, 'd')}</span>
            </>
          ) : (
            <Calendar className="w-6 h-6 text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">{event.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{eventDate ? format(eventDate, 'EEE, MMM d · h:mm a') : ''}</p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{event.venue_name || event.neighborhood_name || 'Baltimore'}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/events/${event.id}`} className="block rounded-xl bg-card border border-border overflow-hidden hover:shadow-md transition-all group">
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {event.image_url ? (
          <AppImage src={event.image_url} className="w-full h-full" clickable={false} aspectRatio="16:9" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
            <Calendar className="w-12 h-12 text-accent/40" />
          </div>
        )}
        {event.is_free && (
          <Badge className="absolute top-3 left-3 bg-green-500/90 text-white border-0 text-xs">Free</Badge>
        )}
        {event.category && (
          <Badge variant="secondary" className="absolute top-3 right-3 bg-black/50 text-white border-0 backdrop-blur-sm text-xs capitalize">{event.category}</Badge>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-accent font-semibold mb-1.5">
          <Clock className="w-3.5 h-3.5" />
          {eventDate ? format(eventDate, 'EEE, MMM d · h:mm a') : 'Date TBD'}
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">{event.title}</h3>
        {event.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
          <MapPin className="w-3 h-3" />
          <span>{event.venue_name || event.neighborhood_name || 'Baltimore'}</span>
        </div>
        <InlineRSVP eventId={event.id} />
      </div>
    </Link>
  );
}