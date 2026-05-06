import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bookmark } from 'lucide-react';
import PostCard from '@/components/shared/PostCard';
import StoryCard from '@/components/shared/StoryCard';

export default function BusinessSavedTab({ business, user }) {
  const { data: savedPostRecords = [] } = useQuery({
    queryKey: ['biz-saved-posts', user?.id],
    queryFn: () => base44.entities.SavedPost.filter({ user_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const savedPostIds = savedPostRecords.map(s => s.post_id);

  const { data: savedPosts = [] } = useQuery({
    queryKey: ['biz-saved-posts-data', savedPostIds.join(',')],
    queryFn: async () => {
      if (!savedPostIds.length) return [];
      const all = await base44.entities.Post.list('-created_date', 200);
      return all.filter(p => savedPostIds.includes(p.id) && !p.is_deleted);
    },
    enabled: savedPostIds.length > 0,
    staleTime: 30000,
  });

  const { data: savedStoryRecords = [] } = useQuery({
    queryKey: ['biz-saved-stories', user?.id],
    queryFn: () => base44.entities.SavedStory.filter({ user_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const savedStoryIds = savedStoryRecords.map(s => s.story_id);

  const { data: savedStories = [] } = useQuery({
    queryKey: ['biz-saved-stories-data', savedStoryIds.join(',')],
    queryFn: async () => {
      if (!savedStoryIds.length) return [];
      const all = await base44.entities.Story.list('-created_date', 200);
      return all.filter(s => savedStoryIds.includes(s.id));
    },
    enabled: savedStoryIds.length > 0,
    staleTime: 30000,
  });

  if (savedPosts.length === 0 && savedStories.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-40" />
        No saved content yet. Bookmark posts and stories to find them here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {savedPosts.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Posts</p>
          {savedPosts.map(p => <PostCard key={p.id} post={p} currentUserId={user?.id} />)}
        </div>
      )}
      {savedStories.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Stories</p>
          {savedStories.map(story => <StoryCard key={story.id} story={story} />)}
        </div>
      )}
    </div>
  );
}