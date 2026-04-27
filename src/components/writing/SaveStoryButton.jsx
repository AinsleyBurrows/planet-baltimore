import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bookmark } from 'lucide-react';

export default function SaveStoryButton({ storyId }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: saved } = useQuery({
    queryKey: ['saved-story', storyId, user?.id],
    queryFn: () => base44.entities.SavedStory.filter({ user_id: user.id, story_id: storyId }),
    enabled: !!user?.id && !!storyId,
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (saved?.length > 0) {
        await base44.entities.SavedStory.delete(saved[0].id);
      } else {
        await base44.entities.SavedStory.create({ user_id: user.id, story_id: storyId, saved_at: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-story', storyId, user?.id] });
    },
  });

  if (!user) return null;

  const isSaved = saved?.length > 0;

  return (
    <button
      onClick={() => toggleSaveMutation.mutate()}
      disabled={toggleSaveMutation.isPending}
      className={`p-2 rounded-full transition-colors ${
        isSaved
          ? 'text-accent bg-accent/10 hover:bg-accent/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
      }`}
      aria-label={isSaved ? 'Unsave story' : 'Save story'}
    >
      <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
    </button>
  );
}