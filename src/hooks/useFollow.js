import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

async function updateFollowersCount(targetType, targetId, delta) {
  try {
    const entityMap = {
      business: 'BusinessPage',
      artist: 'ArtistPage',
      arts_org: 'ArtsOrganization',
      community: 'Community',
    };
    const entityName = entityMap[targetType];
    if (!entityName) return;
    const records = await base44.entities[entityName].filter({ id: targetId });
    const record = records[0];
    if (!record) return;
    const current = record.followers_count || 0;
    await base44.entities[entityName].update(targetId, { followers_count: Math.max(0, current + delta) });
  } catch {
    // Non-critical — follow record is still created/deleted
  }
}

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
        await updateFollowersCount(targetType, targetId, -1);
        return { action: 'unfollowed' };
      } else {
        await base44.entities.Follow.create({
          follower_id: currentUserId,
          target_type: targetType,
          target_id: targetId,
          target_name: targetName,
        });
        await updateFollowersCount(targetType, targetId, +1);
        return { action: 'followed' };
      }
    },
    onSuccess: (_data, { targetType, targetId }) => {
      queryClient.invalidateQueries({ queryKey: ['follows', currentUserId] });
      // Invalidate the target entity so follower count refreshes everywhere
      if (targetType === 'business') queryClient.invalidateQueries({ queryKey: ['business', targetId] });
      if (targetType === 'artist') queryClient.invalidateQueries({ queryKey: ['artist', targetId] });
      if (targetType === 'arts_org') queryClient.invalidateQueries({ queryKey: ['arts-org', targetId] });
      if (targetType === 'community') queryClient.invalidateQueries({ queryKey: ['community', targetId] });
    },
  });

  const isFollowing = (targetType, targetId) =>
    follows.some(f => f.target_id === targetId && f.target_type === targetType);

  const toggle = (targetType, targetId, targetName) =>
    followMutation.mutate({ targetType, targetId, targetName });

  return { follows, isFollowing, toggle, isPending: followMutation.isPending };
}