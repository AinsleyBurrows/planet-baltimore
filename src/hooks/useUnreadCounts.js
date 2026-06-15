import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useUnreadCounts() {
  const { data: user } = useQuery({
    queryKey: ['current-user-unread'],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
    retry: false,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: () => base44.entities.Notification.filter({ recipient_id: user.id, is_read: false }),
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: () => base44.entities.Message.filter({ recipient_id: user.id, is_read: false }),
    enabled: !!user?.id,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  return {
    unreadNotifications: notifications.length,
    unreadMessages: messages.length,
  };
}