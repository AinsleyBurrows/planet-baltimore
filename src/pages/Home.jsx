import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PostCard from '@/components/shared/PostCard';
import StoryCard from '@/components/shared/StoryCard';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Users, Sparkles, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DiscoverCard from '@/components/discovery/DiscoverCard';
import StoryBar from '@/components/stories/StoryBar.jsx';

const FILTERS = ['For You', 'Following', 'Nearby', 'Discover'];

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

// Simple Fisher-Yates shuffle to surface serendipitous content
function shuffleSeed(arr, seed = 1) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.abs((seed * 1103515245 + 12345) % (i + 1));
    seed = j;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('For You');
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setCurrentUser); }, []);

  const handleDeletePost = async (postId) => {
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ['home-posts'] });
  };

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['home-posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 30),
    staleTime: 120000,
  });
  const { data: stories = [], isLoading: loadingStories } = useQuery({
    queryKey: ['home-stories'],
    queryFn: () => base44.entities.Story.filter({ status: 'published' }, '-created_date', 15),
    staleTime: 120000,
  });
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['home-events'],
    queryFn: () => base44.entities.Event.filter({ status: 'upcoming' }, 'date', 15),
    staleTime: 120000,
  });
  const { data: follows = [], isLoading: loadingFollows } = useQuery({
    queryKey: ['follows', currentUser?.id],
    queryFn: () => base44.entities.Follow.filter({ follower_id: currentUser.id }),
    enabled: !!currentUser?.id,
  });

  const isLoading = loadingPosts || loadingStories || loadingEvents || (activeFilter === 'Following' && loadingFollows);

  const feedItems = useMemo(() => {
    const followedNames = new Set(follows.map(f => f.target_name).filter(Boolean));
    const followedIds = new Set(follows.map(f => f.target_id).filter(Boolean));
    const filteredPosts = posts.filter(p => !p.is_deleted);

    let items = [];

    if (activeFilter === 'For You') {
      // Interleave followed + trending content; every 4th item is from a new category
      const followedPosts = filteredPosts.filter(p => followedIds.has(p.author_id) || followedNames.has(p.author_name));
      const otherPosts = filteredPosts.filter(p => !followedIds.has(p.author_id) && !followedNames.has(p.author_name));
      const followedEvents = events.filter(e => followedIds.has(e.organizer_id) || followedNames.has(e.organizer_name));
      const discoverEvents = events.filter(e => !followedIds.has(e.organizer_id) && !followedNames.has(e.organizer_name));

      // Mix: 2 followed, 1 discover, 2 followed, 1 event...
      const followed = [
        ...followedPosts.map(p => ({ type: 'post', date: p.created_date, data: p, reason: 'Following' })),
        ...stories.slice(0, 10).map(s => ({ type: 'story', date: s.published_at || s.created_date, data: s, reason: '' })),
        ...followedEvents.map(e => ({ type: 'event', date: e.created_date, data: e, reason: 'From someone you follow' })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      const discover = [
        ...otherPosts.slice(0, 20).map(p => ({ type: 'post', date: p.created_date, data: p, isNew: true })),
        ...discoverEvents.slice(0, 8).map(e => ({ type: 'event', date: e.created_date, data: e, isNew: true })),
      ];

      // Weave discover items in every ~3 followed items
      const merged = [];
      let di = 0;
      followed.forEach((item, idx) => {
        merged.push(item);
        if ((idx + 1) % 3 === 0 && di < discover.length) {
          merged.push(discover[di++]);
        }
      });
      // Add remaining discover
      while (di < discover.length) merged.push(discover[di++]);
      items = merged.slice(0, 50);

    } else if (activeFilter === 'Following') {
      const fp = filteredPosts.filter(p => followedNames.has(p.author_name) || followedIds.has(p.author_id) || followedIds.has(p.page_id));
      const fs = stories.filter(s => followedNames.has(s.author_name) || followedIds.has(s.author_id));
      const fe = events.filter(e => followedNames.has(e.organizer_name) || followedIds.has(e.organizer_id));
      items = [
        ...fp.map(p => ({ type: 'post', date: p.created_date, data: p })),
        ...fs.map(s => ({ type: 'story', date: s.published_at || s.created_date, data: s })),
        ...fe.map(e => ({ type: 'event', date: e.created_date, data: e })),
      ];

    } else if (activeFilter === 'Nearby') {
      const neighborhood = currentUser?.neighborhood_names?.[0];
      const np = neighborhood ? filteredPosts.filter(p => p.neighborhood_name === neighborhood) : filteredPosts.slice(0, 20);
      const ne = neighborhood ? events.filter(e => e.neighborhood_name === neighborhood) : events.slice(0, 10);
      items = [
        ...np.map(p => ({ type: 'post', date: p.created_date, data: p })),
        ...ne.map(e => ({ type: 'event', date: e.created_date, data: e })),
      ];

    } else if (activeFilter === 'Discover') {
      // Pure serendipity: shuffle everything, surface things user hasn't seen yet
      const allItems = [
        ...filteredPosts.map(p => ({ type: 'post', date: p.created_date, data: p, isNew: true })),
        ...stories.map(s => ({ type: 'story', date: s.published_at || s.created_date, data: s, isNew: true })),
        ...events.map(e => ({ type: 'event', date: e.created_date, data: e, isNew: true })),
      ];
      const dayOfYear = Math.floor(Date.now() / 86400000);
      items = shuffleSeed(allItems, dayOfYear).slice(0, 40);
    }

    if (activeFilter !== 'Discover' && activeFilter !== 'For You') {
      items = items.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return items;
  }, [activeFilter, posts, stories, events, follows, currentUser]);

  const isEmpty = !isLoading && feedItems.length === 0;

  return (
    <div className="space-y-5 sm:space-y-7 overflow-x-hidden">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 p-5 sm:p-8 lg:p-12">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1.5 text-foreground">Planet Baltimore</h1>
          <p className="text-muted-foreground text-sm">Your city. Your community. Your feed.</p>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:-mx-4 px-3 sm:px-4">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => { setActiveFilter(filter); setFilterLoading(true); setTimeout(() => setFilterLoading(false), 400); }}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeFilter === filter ? 'bg-foreground text-background shadow-sm' : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
            }`}
          >
            {filter === 'Discover' && <Compass className="w-4 h-4 sm:w-5 sm:h-5" />}
            {filter}
          </button>
        ))}
      </div>

      {/* Stories bar — flush, no card wrapper */}
      <div className="-mx-3 sm:-mx-4 px-3 sm:px-4 border-b border-border pb-3 sm:pb-4">
        <StoryBar currentUser={currentUser} />
      </div>

      {activeFilter === 'Discover' && (
        <div className="flex items-center gap-2 p-3 sm:p-4 bg-accent/5 border border-accent/20 rounded-xl text-xs sm:text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
          <span>Broadening your world — content from across Baltimore you haven't seen yet.</span>
        </div>
      )}

      <div className="space-y-4 sm:space-y-5">
        {isLoading || filterLoading ? (
          <FeedSkeleton />
        ) : feedItems.length === 0 && !isEmpty ? (
          <FeedSkeleton />
        ) : isEmpty ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              {activeFilter === 'Following' ? <Users className="w-7 h-7 sm:w-9 sm:h-9 text-accent" /> : <span className="text-3xl sm:text-4xl">🏙️</span>}
            </div>
            <h3 className="font-semibold text-foreground mb-2 text-base sm:text-lg">
              {activeFilter === 'Following' ? 'No activity from people you follow' : 'Your feed is quiet'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">
              {activeFilter === 'Following' ? 'Follow artists, businesses, and organizations to see their updates here.' : 'Explore Baltimore communities to fill your feed.'}
            </p>
            {activeFilter === 'Following' && (
              <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
                <Link to="/artists"><Button variant="outline" size="sm" className="rounded-lg text-xs sm:text-sm">Browse Artists</Button></Link>
                <Link to="/arts-organizations"><Button variant="outline" size="sm" className="rounded-lg text-xs sm:text-sm">Browse Orgs</Button></Link>
                <Link to="/businesses"><Button variant="outline" size="sm" className="rounded-lg text-xs sm:text-sm">Browse Businesses</Button></Link>
              </div>
            )}
          </div>
        ) : (
          feedItems.map((item, idx) => {
            const cardContent = (() => {
              if (item.type === 'post') return <PostCard key={`post-${item.data.id}-${idx}`} post={item.data} currentUserId={currentUser?.id} onDelete={handleDeletePost} />;
              if (item.type === 'story') return (
                <div className="relative">
                  <div className="absolute -top-1 left-4 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">Story</span>
                  </div>
                  <div className="pt-3"><StoryCard story={item.data} /></div>
                </div>
              );
              if (item.type === 'event') return (
                <div className="relative">
                  <div className="absolute -top-1 left-4 z-10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Event</span>
                  </div>
                  <div className="pt-3"><EventCard event={item.data} /></div>
                </div>
              );
              return null;
            })();

            if (item.isNew || item.reason) {
              return (
                <DiscoverCard key={`${item.type}-${item.data.id}-${idx}`} isNew={item.isNew} reason={item.reason}>
                  {cardContent}
                </DiscoverCard>
              );
            }
            return <React.Fragment key={`${item.type}-${item.data.id}-${idx}`}>{cardContent}</React.Fragment>;
          })
        )}
      </div>
    </div>
  );
}