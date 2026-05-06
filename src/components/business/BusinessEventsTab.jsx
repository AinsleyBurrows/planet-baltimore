import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, CalendarCheck, Trash2 } from 'lucide-react';
import EventCard from '@/components/shared/EventCard';

export default function BusinessEventsTab({ business, isOwner }) {
  const queryClient = useQueryClient();

  // Events the owner is organizing
  const { data: organizedEvents = [] } = useQuery({
    queryKey: ['biz-organized-events', business.owner_id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: business.owner_id }, '-date', 20),
    enabled: !!business.owner_id,
    staleTime: 30000,
  });

  // RSVPs
  const { data: rsvps = [] } = useQuery({
    queryKey: ['biz-rsvps', business.owner_id],
    queryFn: () => base44.entities.RSVP.filter({ user_id: business.owner_id }),
    enabled: !!business.owner_id,
    staleTime: 30000,
  });

  const rsvpEventIds = rsvps.map(r => r.event_id);

  const { data: attendingEvents = [] } = useQuery({
    queryKey: ['biz-attending-events', rsvpEventIds.join(',')],
    queryFn: async () => {
      if (!rsvpEventIds.length) return [];
      const all = await base44.entities.Event.list('date', 200);
      return all.filter(e => rsvpEventIds.includes(e.id));
    },
    enabled: rsvpEventIds.length > 0,
    staleTime: 30000,
  });

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    await base44.entities.Event.delete(eventId);
    queryClient.invalidateQueries({ queryKey: ['biz-organized-events', business.owner_id] });
  };

  return (
    <div className="space-y-8">
      {/* Organized Events */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-accent" /> Organized Events
        </h3>
        {organizedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 bg-secondary/30 rounded-xl">No events organized yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {organizedEvents.map(e => (
              <div key={e.id} className="relative group">
                <EventCard event={e} />
                {isOwner && (
                  <button
                    onClick={() => handleDeleteEvent(e.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    aria-label="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attending Events */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <CalendarCheck className="w-4 h-4 text-accent" /> Attending
        </h3>
        {attendingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6 bg-secondary/30 rounded-xl">Not attending any events.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {attendingEvents.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}