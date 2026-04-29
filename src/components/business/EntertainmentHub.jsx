import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Music, Ticket, Users, Play, CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EventCard from '@/components/shared/EventCard';
import AppImage from '@/components/shared/AppImage';
import BusinessPostsFeed from '@/components/business/BusinessPostsFeed';

export default function EntertainmentHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();

  const ticketUrl = business.hub_data?.ticket_url;
  const capacity = business.hub_data?.capacity;
  const ageRestriction = business.hub_data?.age_restriction;
  const dresscode = business.hub_data?.dresscode;
  const showcaseUrls = business.hub_data?.showcase_urls || [];
  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());
  const pastEvents = events.filter(e => e.date && new Date(e.date) <= new Date());

  return (
    <div className="space-y-6">


      {ticketUrl && (
        <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
          <Ticket className="w-4 h-4" /> Get Tickets
        </a>
      )}

      {/* Venue Info */}
      {(capacity || ageRestriction || dresscode) && (
        <div className="grid grid-cols-3 gap-3">
          {capacity && (
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/40 rounded-xl">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-xs text-muted-foreground">Capacity</span>
              <span className="text-sm font-bold text-foreground">{capacity}</span>
            </div>
          )}
          {ageRestriction && (
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/40 rounded-xl">
              <span className="text-lg font-bold text-accent">{ageRestriction}</span>
              <span className="text-xs text-muted-foreground">Age</span>
            </div>
          )}
          {dresscode && (
            <div className="flex flex-col items-center gap-1 p-3 bg-secondary/40 rounded-xl text-center">
              <Music className="w-5 h-5 text-accent" />
              <span className="text-xs text-muted-foreground">Dress Code</span>
              <span className="text-xs font-semibold text-foreground">{dresscode}</span>
            </div>
          )}
        </div>
      )}

      {/* Showcase / Gallery */}
      {showcaseUrls.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Play className="w-4 h-4 text-accent" /> Showcase</h2>
          <div className="grid grid-cols-2 gap-2">
            {showcaseUrls.slice(0, 4).map((url, i) => (
              <AppImage key={i} src={url} className="w-full aspect-video rounded-xl" aspectRatio="16:9" />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /> Upcoming Shows & Events</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">No upcoming events posted yet.</p>
        ) : (
          <div className="space-y-3">{upcomingEvents.slice(0, 5).map(e => <EventCard key={e.id} event={e} compact />)}</div>
        )}
      </div>

      <BusinessPostsFeed business={business} isOwner={isOwner} user={user} />
    </div>
  );
}