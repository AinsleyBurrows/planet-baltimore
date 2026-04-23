import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PostCard from '@/components/shared/PostCard';
import StoryCard from '@/components/shared/StoryCard';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FILTERS = ['For You', 'Following', 'Nearby'];

function FeedSkeleton() {
  return Array(3).fill(0).map((_, i) => (
    <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
      </div>
      <Skeleton className="h-16 w-full rounded" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  ));
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('For You');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  // All posts
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['home-posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
  });

  // All stories (published)
  const { data: stories = [], isLoading: loadingStories } = useQuery({
    queryKey: ['home-stories'],
    queryFn: () => base44.entities.Story.filter({ status: 'published' }, '-created_date', 20),
  });

  // Upcoming events
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['home-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'upcoming' }, '-date', 20),
  });

  // Current user's follows
  const { data: follows = [], isLoading: loadingFollows } = useQuery({
    queryKey: ['follows', currentUser?.id],
    queryFn: () => base44.entities.Follow.filter({ follower_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const isLoading = loadingPosts || loadingStories || loadingEvents || (activeFilter === 'Following' && loadingFollows);

  // Build a unified feed sorted by date
  const feedItems = useMemo(() => {
    const followedNames = new Set(follows.map(f => f.target_name).filter(Boolean));
    const followedIds = new Set(follows.map(f => f.target_id).filter(Boolean));

    const filteredPosts = posts.filter(p => !p.is_deleted);
    const filteredStories = stories;
    const filteredEvents = events;

    let items = [];

    if (activeFilter === 'For You') {
      // Mix everything
      items = [
        ...filteredPosts.map(p => ({ type: 'post', date: p.created_date, data: p })),
        ...filteredStories.map(s => ({ type: 'story', date: s.published_at || s.created_date, data: s })),
        ...filteredEvents.map(e => ({ type: 'event', date: e.created_date, data: e })),
      ];
    } else if (activeFilter === 'Following') {
      // Only content from followed entities
      const followedPosts = filteredPosts.filter(p =>
        followedNames.has(p.author_name) || followedIds.has(p.author_id) || followedIds.has(p.page_id)
      );
      const followedStories = filteredStories.filter(s =>
        followedNames.has(s.author_name) || followedIds.has(s.author_id)
      );
      const followedEvents = filteredEvents.filter(e =>
        followedNames.has(e.organizer_name) || followedIds.has(e.organizer_id)
      );
      items = [
        ...followedPosts.map(p => ({ type: 'post', date: p.created_date, data: p })),
        ...followedStories.map(s => ({ type: 'story', date: s.published_at || s.created_date, data: s })),
        ...followedEvents.map(e => ({ type: 'event', date: e.created_date, data: e })),
      ];
    } else if (activeFilter === 'Nearby') {
      const neighborhood = currentUser?.neighborhood_names?.[0];
      const nearbyPosts = neighborhood
        ? filteredPosts.filter(p => p.neighborhood_name === neighborhood)
        : filteredPosts;
      const nearbyEvents = neighborhood
        ? filteredEvents.filter(e => e.neighborhood_name === neighborhood)
        : filteredEvents;
      items = [
        ...nearbyPosts.map(p => ({ type: 'post', date: p.created_date, data: p })),
        ...nearbyEvents.map(e => ({ type: 'event', date: e.created_date, data: e })),
      ];
    }

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activeFilter, posts, stories, events, follows, currentUser]);

  const isEmpty = !isLoading && feedItems.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Home</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {FILTERS.map((filter) => (
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
          <FeedSkeleton />
        ) : isEmpty ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
              {activeFilter === 'Following' ? (
                <Users className="w-7 h-7 text-accent" />
              ) : (
                <span className="text-2xl">🏙️</span>
              )}
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {activeFilter === 'Following' ? 'No activity from people you follow' : 'Your feed is quiet'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {activeFilter === 'Following'
                ? 'Follow artists, businesses, and organizations to see their updates here.'
                : 'Explore Baltimore communities to fill your feed.'}
            </p>
            {activeFilter === 'Following' && (
              <div className="flex gap-3 justify-center mt-5">
                <Link to="/artists"><Button variant="outline" size="sm" className="rounded-lg">Browse Artists</Button></Link>
                <Link to="/arts-organizations"><Button variant="outline" size="sm" className="rounded-lg">Browse Orgs</Button></Link>
                <Link to="/businesses"><Button variant="outline" size="sm" className="rounded-lg">Browse Businesses</Button></Link>
              </div>
            )}
          </div>
        ) : (
          feedItems.map((item, idx) => {
            if (item.type === 'post') {
              return <PostCard key={`post-${item.data.id}`} post={item.data} currentUserId={currentUser?.id} />;
            }
            if (item.type === 'story') {
              return (
                <div key={`story-${item.data.id}`} className="relative">
                  <div className="absolute -top-1 left-4 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">Zine</span>
                  </div>
                  <div className="pt-3">
                    <StoryCard story={item.data} />
                  </div>
                </div>
              );
            }
            if (item.type === 'event') {
              return (
                <div key={`event-${item.data.id}`} className="relative">
                  <div className="absolute -top-1 left-4 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Event</span>
                  </div>
                  <div className="pt-3">
                    <EventCard event={item.data} />
                  </div>
                </div>
              );
            }
            return null;
          })
        )}
      </div>
    </div>
  );
}