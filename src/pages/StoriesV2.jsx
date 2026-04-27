import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Flame, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import StoryCard from '@/components/shared/StoryCard';
import DiscoveryExplore from '@/components/writing/DiscoveryExplore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORIES = [
  { id: 'all', label: 'All Stories', icon: BookOpen },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'recent', label: 'Recent', icon: Clock },
  { id: 'featured', label: 'Featured', icon: Sparkles },
];

export default function StoriesV2() {
  const [activeTab, setActiveTab] = useState('explore');

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['stories-published'],
    queryFn: () => base44.entities.Story.filter({ status: 'published' }, '-published_at', 100),
  });

  const { data: featured = [] } = useQuery({
    queryKey: ['stories-featured'],
    queryFn: () => base44.entities.Story.filter({ status: 'published', is_featured: true }, '-published_at', 10),
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['collections-featured'],
    queryFn: () => base44.entities.StoryCollection.filter({ is_featured: true }, '', 5),
  });

  const trending = [...stories].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Baltimore Writers</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover stories from the community</p>
        </div>
        <Link to="/create-story">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Write</span>
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-2">
          <TabsTrigger value="explore">Explore</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        {/* Explore Tab */}
        <TabsContent value="explore" className="space-y-6">
          <DiscoveryExplore />
        </TabsContent>

        {/* Trending Tab */}
        <TabsContent value="trending" className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {trending.map((story, idx) => (
                <div key={story.id} className="flex gap-4 items-start">
                  <div className="text-2xl font-bold text-accent/60 w-8 flex-shrink-0">#{idx + 1}</div>
                  <div className="flex-1">
                    <StoryCard story={story} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {collections.map(collection => (
                <Link key={collection.id} to={`/collection/${collection.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {collection.cover_image && (
                      <img src={collection.cover_image} alt="" className="w-full aspect-[3/2] object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground truncate">{collection.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{collection.description}</p>
                      <p className="text-xs text-muted-foreground mt-3">{collection.story_ids?.length || 0} stories</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No collections yet</p>
            </div>
          )}
        </TabsContent>

        {/* Featured Tab */}
        <TabsContent value="featured" className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : featured.length > 0 ? (
            <div className="space-y-6">
              {featured.map(story => (
                <StoryCard key={story.id} story={story} featured />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured stories yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}