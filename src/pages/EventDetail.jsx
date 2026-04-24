import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, MapPin, Navigation, Trash2 } from 'lucide-react';
import ShareModal from '@/components/shared/ShareModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AppImage from '@/components/shared/AppImage';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import RSVPButton from '@/components/events/RSVPButton';
import AttendeeList from '@/components/events/AttendeeList';
import AttendeeProfiles from '@/components/events/AttendeeProfiles';
import CommentSection from '@/components/shared/CommentSection';
import EventTicketing from '@/components/events/EventTicketing';

export default function EventDetail() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showShare, setShowShare] = useState(false);

  const eventId = window.location.pathname.split('/events/')[1];

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const events = await base44.entities.Event.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId,
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: () => base44.entities.RSVP.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const goingCount = attendees.filter(r => r.status === 'going').length;

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Event.delete(eventId),
    onSuccess: () => navigate('/events'),
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="aspect-[16/9] rounded-xl" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  if (!event) return (
    <div className="text-center py-16">
      <h3 className="font-semibold text-foreground mb-1">Event not found</h3>
      <Button variant="ghost" onClick={() => navigate('/events')} className="mt-4">Back to Events</Button>
    </div>
  );

  const eventDate = event.date ? new Date(event.date) : null;
  const hasLocation = event.latitude && event.longitude;
  const mapsUrl = event.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}` : '';

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 rounded-full hover:bg-secondary active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ArrowLeft className="w-5 h-5" /></button>

      {/* Hero Image */}
      {event.image_url && (
        <div className="aspect-[16/9] rounded-xl overflow-hidden">
          <AppImage src={event.image_url} className="w-full h-full" />
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          {event.category && <Badge className="bg-accent/10 text-accent border-0 capitalize">{event.category}</Badge>}
          {event.is_free && <Badge className="bg-green-500/10 text-green-600 border-0">Free</Badge>}
        </div>
        <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
      </div>

      {/* Date/Time */}
      <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
        <div className="w-14 h-14 bg-accent/10 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
          {eventDate && (
            <>
              <span className="text-xs font-bold text-accent uppercase">{format(eventDate, 'MMM')}</span>
              <span className="text-xl font-bold text-foreground">{format(eventDate, 'd')}</span>
            </>
          )}
        </div>
        <div>
          <p className="font-medium text-foreground">{eventDate ? format(eventDate, 'EEEE, MMMM d, yyyy') : 'Date TBD'}</p>
          <p className="text-sm text-muted-foreground">{eventDate ? format(eventDate, 'h:mm a') : ''}{event.end_date ? ` – ${format(new Date(event.end_date), 'h:mm a')}` : ''}</p>
        </div>
      </div>

      {/* Location */}
      {(event.venue_name || event.address) && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl">
            <MapPin className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              {event.venue_name && <p className="font-medium text-foreground">{event.venue_name}</p>}
              {event.address && <p className="text-sm text-muted-foreground">{event.address}</p>}
            </div>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-accent hover:underline flex-shrink-0">
                <Navigation className="w-4 h-4" />Directions
              </a>
            )}
          </div>

          {/* Map */}
          {hasLocation && (
            <div className="h-48 rounded-xl overflow-hidden border border-border">
              <MapContainer center={[event.latitude, event.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[event.latitude, event.longitude]}>
                  <Popup>{event.venue_name || event.title}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      )}

      {/* Organizer */}
      <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl">
        <Avatar className="w-10 h-10">
          <AvatarImage src={event.organizer_avatar} />
          <AvatarFallback className="bg-accent/10 text-accent">{event.organizer_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-muted-foreground">Hosted by</p>
          <p className="font-medium text-foreground">{event.organizer_name}</p>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div>
          <h2 className="font-semibold text-foreground mb-2">About this event</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
        </div>
      )}

      {/* Attendee profiles */}
      <AttendeeProfiles eventId={eventId} />

      {/* Comments */}
      <div className="border-t border-border pt-6">
        <CommentSection targetType="event" targetId={eventId} />
      </div>

      {/* Actions */}
      <EventTicketing
        event={event}
        rsvpCount={goingCount}
        onShare={() => setShowShare(true)}
        user={user}
      />

      {user?.id === event.organizer_id && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            aria-label="Delete event"
            onClick={() => { if (window.confirm('Delete this event?')) deleteMutation.mutate(); }}
            className="text-destructive hover:bg-destructive/10 hover:border-destructive transition-all duration-150"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Event
          </Button>
        </div>
      )}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={window.location.href}
        title={event.title}
        description={event.description}
      />
    </div>
  );
}