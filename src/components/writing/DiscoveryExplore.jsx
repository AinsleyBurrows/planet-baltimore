import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Skeleton } from '@/components/ui/skeleton';
import StoryCard from '@/components/shared/StoryCard';

export default function DiscoveryExplore() {
  const [filter, setFilter] = useState('trending');

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories-all'],
    queryFn: () => base44.entities.Story.filter({ status: 'published' }, '-created_date', 100),
  });

  const filtered = (() => {
    if (filter === 'trending') return [...stories].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 20);
    if (filter === 'recent') return stories.slice(0, 20);
    return stories.filter(s => s.category === filter).slice(0, 20);
  })();

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['trending', 'recent', 'blog', 'essay', 'newsletter'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading
          ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
          : filtered.map(story => <StoryCard key={story.id} story={story} />)}
      </div>
    </div>
  );
}