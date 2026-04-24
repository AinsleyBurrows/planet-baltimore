import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Star, Users, MessageCircle } from 'lucide-react';

export default function AttendeeProfiles({ eventId }) {
  const [selectedTab, setSelectedTab] = useState('going');

  const { data: rsvps = [] } = useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: () => base44.entities.RSVP.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.User.list(),
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const going = rsvps
    .filter(r => r.status === 'going')
    .map(r => ({ rsvp: r, user: userMap[r.user_id] }))
    .filter(x => x.user);

  const interested = rsvps
    .filter(r => r.status === 'interested')
    .map(r => ({ rsvp: r, user: userMap[r.user_id] }))
    .filter(x => x.user);

  if (rsvps.length === 0) return null;

  const activeAttendees = selectedTab === 'going' ? going : interested;
  const totalGoing = going.length;
  const totalInterested = interested.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="font-semibold text-foreground">Who's Attending</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{totalGoing + totalInterested} people</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setSelectedTab('going')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selectedTab === 'going'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Going ({totalGoing})
        </button>
        <button
          onClick={() => setSelectedTab('interested')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            selectedTab === 'interested'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="w-4 h-4" />
          Interested ({totalInterested})
        </button>
      </div>

      {/* Grid of attendee profiles */}
      {activeAttendees.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeAttendees.map(({ rsvp, user }) => (
            <Link
              key={rsvp.id}
              to={`/profile/${user.id}`}
              className="p-4 rounded-xl bg-card border border-border hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-accent/10 text-accent font-bold">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                {selectedTab === 'going' && (
                  <Badge className="bg-accent/10 text-accent border-0 text-xs">Going</Badge>
                )}
                {selectedTab === 'interested' && (
                  <Badge className="bg-yellow-500/10 text-yellow-600 border-0 text-xs">Interested</Badge>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
                    {user.full_name || user.email?.split('@')[0]}
                  </h3>
                  {user.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{user.bio}</p>
                  )}
                </div>

                {user.neighborhood_names?.length > 0 && (
                  <p className="text-xs text-muted-foreground">{user.neighborhood_names[0]}</p>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-lg h-8 text-xs gap-1.5 mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    // Navigate to messages with this user
                    window.location.href = `/messages?user=${user.id}`;
                  }}
                >
                  <MessageCircle className="w-3 h-3" />
                  Message
                </Button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No one has marked themselves as {selectedTab} yet.
        </div>
      )}
    </div>
  );
}