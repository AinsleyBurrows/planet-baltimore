import React from 'react';
import { CalendarCheck } from 'lucide-react';
import EventCard from '@/components/shared/EventCard';

export default function RSVPEvents({ myRsvps, rsvpedEvents }) {
  const going = myRsvps.filter(r => r.status === 'going').map(r => r.event_id);
  const interested = myRsvps.filter(r => r.status === 'interested').map(r => r.event_id);
  const goingEvents = rsvpedEvents.filter(e => going.includes(e.id));
  const interestedEvents = rsvpedEvents.filter(e => interested.includes(e.id));

  if (!rsvpedEvents.length) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No RSVPs yet. Find events to attend!</div>;
  }

  return (
    <div className="space-y-8">
      {goingEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-accent mb-4 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4" />Going ({goingEvents.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {goingEvents.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}
      {interestedEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">Interested ({interestedEvents.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {interestedEvents.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}