import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PostCard from '@/components/shared/PostCard';
import { Skeleton } from '@/components/ui/skeleton';

const filters = ['For You', 'Following', 'Nearby', 'Events', 'Artists', 'Trending'];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('For You');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts', activeFilter],
    queryFn: () => base44.entities.Post.list('-created_date', 20),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter
                ? 'bg-foreground text-background'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
              </div>
              <Skeleton className="h-16 w-full rounded" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🏙️</span>
            </div>
            <h3 className="font-semibold text-foreground mb-1">Your feed is quiet</h3>
            <p className="text-sm text-muted-foreground">Follow communities, artists, and neighbors to fill your feed.</p>
          </div>
        ) : (
          posts.filter(p => !p.is_deleted).map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}