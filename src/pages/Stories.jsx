import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StoryCard from '@/components/shared/StoryCard';
import { Skeleton } from '@/components/ui/skeleton';

const categories = ['All', 'Blog', 'Newsletter', 'Essay', 'Announcement', 'Event Recap', 'Recent', 'Trending'];

export default function Stories() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => base44.entities.Story.filter({ status: 'published' }, '-created_date', 50),
  });

  const getFiltered = () => {
    if (activeCategory === 'All') return stories;
    if (activeCategory === 'Recent') return [...stories].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (activeCategory === 'Trending') return [...stories].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    return stories.filter(s => s.category === activeCategory.toLowerCase().replace(' ', '_'));
  };

  const filtered = getFiltered();
  const featured = filtered[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Your Story</h1>
        <Link to="/create-story">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg">
            <Plus className="w-4 h-4" />Write a Zine
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No zines yet</h3>
          <p className="text-sm text-muted-foreground">Be the first to share your zine with Baltimore.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {featured && <StoryCard story={featured} featured />}
          {filtered.slice(1).map((story) => <StoryCard key={story.id} story={story} />)}
        </div>
      )}
    </div>
  );
}