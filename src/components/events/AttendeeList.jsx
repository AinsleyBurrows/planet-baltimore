import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarCheck, Star, Users } from 'lucide-react';

export default function AttendeeList({ eventId }) {
  const { data: rsvps = [], isLoading } = useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: () => base44.entities.RSVP.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.User.list(),
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const going = rsvps.filter(r => r.status === 'going');
  const interested = rsvps.filter(r => r.status === 'interested');

  if (isLoading || rsvps.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-foreground">Attendees</h2>

      {going.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-accent">
            <CalendarCheck className="w-4 h-4" />
            <span>Going ({going.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {going.slice(0, 20).map(rsvp => {
              const u = userMap[rsvp.user_id];
              return (
                <div key={rsvp.id} className="flex items-center gap-2 bg-secondary/60 rounded-full px-3 py-1.5">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={u?.avatar_url} />
                    <AvatarFallback className="text-[10px] bg-accent/10 text-accent">
                      {u?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground">{u?.full_name || u?.email?.split('@')[0] || 'Someone'}</span>
                </div>
              );
            })}
            {going.length > 20 && (
              <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-3 py-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">+{going.length - 20} more</span>
              </div>
            )}
          </div>
        </div>
      )}

      {interested.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Interested ({interested.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {interested.slice(0, 12).map(rsvp => {
              const u = userMap[rsvp.user_id];
              return (
                <div key={rsvp.id} className="flex items-center gap-2 bg-secondary/60 rounded-full px-3 py-1.5">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={u?.avatar_url} />
                    <AvatarFallback className="text-[10px] bg-accent/10 text-accent">
                      {u?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground">{u?.full_name || u?.email?.split('@')[0] || 'Someone'}</span>
                </div>
              );
            })}
            {interested.length > 12 && (
              <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-3 py-1.5">
                <span className="text-xs text-muted-foreground">+{interested.length - 12} more</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}