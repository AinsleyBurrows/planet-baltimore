import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useFollow(currentUserId) {
  const queryClient = useQueryClient();

  const { data: follows = [] } = useQuery({
    queryKey: ['follows', currentUserId],
    queryFn: () => base44.entities.Follow.filter({ follower_id: currentUserId }),
    enabled: !!currentUserId,
    staleTime: 30000,
  });

  const followMutation = useMutation({
    mutationFn: async ({ targetType, targetId, targetName }) => {
      const existing = follows.find(f => f.target_id === targetId && f.target_type === targetType);
      if (existing) {
        await base44.entities.Follow.delete(existing.id);
        return { action: 'unfollowed' };
      } else {
        await base44.entities.Follow.create({
          follower_id: currentUserId,
          target_type: targetType,
          target_id: targetId,
          target_name: targetName,
        });
        return { action: 'followed' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follows', currentUserId] });
    },
  });

  const isFollowing = (targetType, targetId) =>
    follows.some(f => f.target_id === targetId && f.target_type === targetType);

  const toggle = (targetType, targetId, targetName) =>
    followMutation.mutate({ targetType, targetId, targetName });

  return { follows, isFollowing, toggle, isPending: followMutation.isPending };
}