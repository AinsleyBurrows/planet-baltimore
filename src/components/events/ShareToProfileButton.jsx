import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pin, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Toggle that "shares" an event to the current user's profile via the
 * SharedEvent entity. When pinned, the event appears in the user's
 * profile "Shared" tab for others to discover and book.
 */
export default function ShareToProfileButton({ event, className = '' }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sharedRecord } = useQuery({
    queryKey: ['shared-event', user?.id, event?.id],
    queryFn: () =>
      base44.entities.SharedEvent.filter({
        user_id: user.id,
        event_id: event.id,
      }),
    enabled: !!user?.id && !!event?.id,
    staleTime: 30000,
  });

  const isShared = sharedRecord && sharedRecord.length > 0;

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isShared) {
        await base44.entities.SharedEvent.delete(sharedRecord[0].id);
      } else {
        await base44.entities.SharedEvent.create({
          user_id: user.id,
          event_id: event.id,
          event_title: event.title,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-event', user?.id, event?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-shared-events', user?.id] });
    },
  });

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname);
      return;
    }
    toggleMutation.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleMutation.isPending}
      title={isShared ? 'Remove from profile' : 'Share to my profile'}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
        isShared
          ? 'text-[#d4580a] bg-[#d4580a]/10 hover:bg-[#d4580a]/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      } ${className}`}
    >
      {isShared ? <Check className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
      <span>{isShared ? 'On Profile' : 'Share to Profile'}</span>
    </button>
  );
}