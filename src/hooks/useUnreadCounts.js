import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Real-time unread counts for notifications and messages.
 * - Initial counts loaded via React Query (shared cache).
 * - Live updates via entity subscriptions — no polling needed.
 * - Uses the same 'current-user' query key as useCurrentUser so
 *   no extra auth.me() network call is made.
 */
export function useUnreadCounts() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Load initial counts
  useEffect(() => {
    if (!user?.id) return;

    base44.entities.Notification.filter({ user_id: user.id, is_read: false })
      .then(data => setUnreadNotifications(data.length))
      .catch(() => {});

    base44.entities.Message.filter({ recipient_id: user.id, is_read: false })
      .then(data => setUnreadMessages(data.length))
      .catch(() => {});
  }, [user?.id]);

  // Subscribe to real-time notification changes
  useEffect(() => {
    if (!user?.id) return;

    const unsub = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_id !== user.id) return;
      if (event.type === 'create' && !event.data?.is_read) {
        setUnreadNotifications(c => c + 1);
      } else if (event.type === 'update' && event.data?.is_read) {
        setUnreadNotifications(c => Math.max(0, c - 1));
      } else if (event.type === 'delete') {
        // Re-fetch count on delete to stay accurate
        base44.entities.Notification.filter({ user_id: user.id, is_read: false })
          .then(data => setUnreadNotifications(data.length))
          .catch(() => {});
      }
    });

    return unsub;
  }, [user?.id]);

  // Subscribe to real-time message changes
  useEffect(() => {
    if (!user?.id) return;

    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.recipient_id !== user.id) return;
      if (event.type === 'create' && !event.data?.is_read) {
        setUnreadMessages(c => c + 1);
      } else if (event.type === 'update' && event.data?.is_read) {
        setUnreadMessages(c => Math.max(0, c - 1));
      } else if (event.type === 'delete') {
        base44.entities.Message.filter({ recipient_id: user.id, is_read: false })
          .then(data => setUnreadMessages(data.length))
          .catch(() => {});
      }
    });

    return unsub;
  }, [user?.id]);

  return { unreadNotifications, unreadMessages };
}