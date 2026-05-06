import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import StoryCard from '@/components/shared/StoryCard';

export default function BusinessStoriesTab({ business, isOwner }) {
  const queryClient = useQueryClient();

  const { data: stories = [] } = useQuery({
    queryKey: ['business-stories', business.owner_id],
    queryFn: () => base44.entities.Story.filter({ author_id: business.owner_id }, '-created_date', 50),
    enabled: !!business.owner_id,
    staleTime: 30000,
  });

  const handleDelete = async (storyId) => {
    if (!window.confirm('Delete this story?')) return;
    await base44.entities.Story.delete(storyId);
    queryClient.invalidateQueries({ queryKey: ['business-stories', business.owner_id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <Link
          to="/create-story"
          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Write a Story or Blog Post
        </Link>
      )}

      {stories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
          No stories published yet.
        </div>
      ) : (
        stories.map(story => (
          <div key={story.id} className="relative group">
            <StoryCard story={story} />
            {isOwner && (
              <button
                onClick={() => handleDelete(story.id)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                aria-label="Delete story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}