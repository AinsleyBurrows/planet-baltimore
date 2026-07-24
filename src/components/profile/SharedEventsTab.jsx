import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Share2 } from 'lucide-react';
import EventCard from '@/components/shared/EventCard';

/**
 * Profile tab showing events the user has shared to their profile.
 * Visible to anyone viewing the profile — clicking a card opens the
 * event detail page where visitors can RSVP or book tickets.
 */
export default function SharedEventsTab({ userId, isOwnProfile }) {
  const { data: sharedRecords = [], isLoading } = useQuery({
    queryKey: ['profile-shared-events', userId],
    queryFn: () =>
      base44.entities.SharedEvent.filter({ user_id: userId }, '-created_date', 50),
    enabled: !!userId,
    staleTime: 30000,
  });

  const eventIds = sharedRecords.map((s) => s.event_id);

  const { data: events = [] } = useQuery({
    queryKey: ['shared-events-data', eventIds.join(',')],
    queryFn: async () => {
      if (!eventIds.length) return [];
      const results = await Promise.all(
        eventIds.map((id) => base44.entities.Event.get(id).catch(() => null))
      );
      return results.filter(Boolean);
    },
    enabled: eventIds.length > 0,
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <Share2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
        {isOwnProfile
          ? 'Share events to your profile so others can discover and book them.'
          : 'No shared events yet.'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}