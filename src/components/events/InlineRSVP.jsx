import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarCheck, CalendarPlus, Star } from 'lucide-react';

export default function InlineRSVP({ eventId, onClick }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: existingRsvp } = useQuery({
    queryKey: ['rsvp', eventId, user?.id],
    queryFn: () => base44.entities.RSVP.filter({ user_id: user.id, event_id: eventId }),
    enabled: !!user?.id,
    select: data => data?.[0] || null,
  });

  const { data: attendees = [] } = useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: () => base44.entities.RSVP.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const goingCount = attendees.filter(r => r.status === 'going').length;

  const rsvpMutation = useMutation({
    mutationFn: async (status) => {
      if (!user) return;
      if (existingRsvp) {
        if (existingRsvp.status === status) {
          await base44.entities.RSVP.delete(existingRsvp.id);
          return null;
        }
        return base44.entities.RSVP.update(existingRsvp.id, { status });
      }
      return base44.entities.RSVP.create({ user_id: user.id, event_id: eventId, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rsvp', eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['rsvps', eventId] });
    },
  });

  const currentStatus = existingRsvp?.status;

  const handleClick = (e, status) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) rsvpMutation.mutate(status);
  };

  return (
    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
      <button
        onClick={(e) => handleClick(e, 'going')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          currentStatus === 'going'
            ? 'bg-accent text-accent-foreground'
            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
        }`}
      >
        {currentStatus === 'going' ? <CalendarCheck className="w-3.5 h-3.5" /> : <CalendarPlus className="w-3.5 h-3.5" />}
        Going
        {goingCount > 0 && <span className="opacity-75">· {goingCount}</span>}
      </button>

      <button
        onClick={(e) => handleClick(e, 'interested')}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          currentStatus === 'interested'
            ? 'bg-yellow-500/15 text-yellow-600 border border-yellow-400/40'
            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground'
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${currentStatus === 'interested' ? 'fill-yellow-500 text-yellow-500' : ''}`} />
        Interested
      </button>
    </div>
  );
}