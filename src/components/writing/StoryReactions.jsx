import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Sparkles, Zap, Brain } from 'lucide-react';

const REACTIONS = [
  { type: 'like', icon: Heart, label: 'Like', color: 'text-red-500' },
  { type: 'love', icon: Sparkles, label: 'Love', color: 'text-pink-500' },
  { type: 'wow', icon: Zap, label: 'Wow', color: 'text-yellow-500' },
  { type: 'think', icon: Brain, label: 'Thoughtful', color: 'text-blue-500' },
];

export default function StoryReactions({ storyId }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: reactions = [] } = useQuery({
    queryKey: ['story-reactions', storyId],
    queryFn: () => base44.entities.StoryReaction.filter({ story_id: storyId }, '', 100),
    enabled: !!storyId,
  });

  const addReactionMutation = useMutation({
    mutationFn: (type) => {
      const existing = reactions.find(r => r.user_id === user.id && r.story_id === storyId);
      if (existing) {
        return base44.entities.StoryReaction.update(existing.id, { type });
      }
      return base44.entities.StoryReaction.create({ user_id: user.id, story_id: storyId, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-reactions', storyId] });
    },
  });

  const userReaction = reactions.find(r => r.user_id === user?.id);
  const reactionCounts = REACTIONS.map(r => ({
    ...r,
    count: reactions.filter(reaction => reaction.type === r.type).length,
  })).filter(r => r.count > 0 || userReaction?.type === r.type);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {reactionCounts.map(reaction => {
        const Icon = reaction.icon;
        const isSelected = userReaction?.type === reaction.type;
        return (
          <button
            key={reaction.type}
            onClick={() => addReactionMutation.mutate(reaction.type)}
            disabled={addReactionMutation.isPending}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isSelected
                ? `${reaction.color} bg-${reaction.type}-100 dark:bg-${reaction.type}-500/20`
                : 'text-muted-foreground bg-secondary hover:bg-secondary/80'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {reaction.count > 0 && <span>{reaction.count}</span>}
          </button>
        );
      })}
      {reactionCounts.length === 0 && (
        <button
          onClick={() => addReactionMutation.mutate('like')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground bg-secondary hover:bg-secondary/80 transition-all"
        >
          <Heart className="w-3.5 h-3.5" />
          React
        </button>
      )}
    </div>
  );
}