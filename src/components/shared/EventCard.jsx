import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import AppImage from './AppImage';
import InlineRSVP from '@/components/events/InlineRSVP';
import EventLikeShareButtons from '@/components/events/EventLikeShareButtons';

export default function EventCard({ event, compact = false }) {
  const navigate = useNavigate();
  const eventDate = event.date ? new Date(event.date) : null;

  if (compact) {
    return (
      <Link to={`/events/${event.id}`} className="flex gap-3 p-2.5 sm:p-3 rounded-xl bg-card border border-border hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-accent/10 flex flex-col items-center justify-center">
          {eventDate ? (
            <>
              <span className="text-[10px] sm:text-xs font-bold text-accent uppercase">{format(eventDate, 'MMM')}</span>
              <span className="text-base sm:text-lg font-bold text-foreground">{format(eventDate, 'd')}</span>
            </>
          ) : (
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-accent transition-colors">{event.title}</h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{eventDate ? format(eventDate, 'EEE, MMM d · h:mm a') : ''}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{event.venue_name || event.neighborhood_name || 'Baltimore'}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      onClick={() => navigate(`/events/${event.id}`)}
      className="block rounded-xl bg-card border border-border overflow-hidden hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
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

      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-accent font-semibold mb-2">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{eventDate ? format(eventDate, 'EEE, MMM d · h:mm a') : 'Date TBD'}</span>
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 text-sm">{event.title}</h3>
        {event.description && <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground mt-3 sm:mt-4">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{event.venue_name || event.neighborhood_name || 'Baltimore'}</span>
        </div>
        {event.organizer_id && (
          <Link
            to={`/profile/${event.organizer_id}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 mt-2 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-5 h-5 flex-shrink-0">
              <AvatarImage src={event.organizer_avatar} />
              <AvatarFallback className="bg-accent/10 text-accent text-[9px] font-bold">{event.organizer_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground hover:text-accent transition-colors truncate">{event.organizer_name}</span>
          </Link>
        )}
        <div className="flex items-center justify-between mt-3" onClick={e => e.stopPropagation()}>
          <InlineRSVP eventId={event.id} />
          <EventLikeShareButtons event={event} />
        </div>
      </div>
    </div>
  );
}