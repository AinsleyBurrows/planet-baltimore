import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, BookOpen, TrendingUp, Star, BookMarked, Feather, Mic2, Film, ScrollText, NotebookPen, AlignLeft, BookText, ChevronDown, MoreVertical, Trash2, VolumeX, Volume2 } from 'lucide-react';
import StoryCard from '@/components/shared/StoryCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Stories() {
  const [activeView, setActiveView] = useState('discover'); // discover, trending, featured
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const isAdmin = currentUser?.role === 'admin';

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Story.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-stories'] });
      queryClient.invalidateQueries({ queryKey: ['featured-stories'] });
    },
  });

  const muteMutation = useMutation({
    mutationFn: ({ id, muted }) => base44.entities.Story.update(id, { visibility: muted ? 'private' : 'public' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-stories'] });
      queryClient.invalidateQueries({ queryKey: ['featured-stories'] });
    },
  });

  const { data: publishedStories = [], isLoading } = useQuery({
    queryKey: ['published-stories'],
    queryFn: () => base44.entities.Story.filter({ status: 'published', visibility: 'public' }, '-published_at', 100),
    staleTime: 300000, // 5 minutes
  });

  const { data: featuredStories = [] } = useQuery({
    queryKey: ['featured-stories'],
    queryFn: () => base44.entities.Story.filter({ status: 'published', visibility: 'public', is_featured: true }, '-published_at', 10),
    staleTime: 300000,
  });

  const categories = ['all', ...new Set(publishedStories.map(s => s.category).filter(Boolean))];

  const filteredStories = activeCategory === 'all' 
    ? publishedStories 
    : publishedStories.filter(s => s.category === activeCategory);

  const trendingStories = [...publishedStories]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 10);

  let displayStories = [];
  if (activeView === 'discover') {
    displayStories = filteredStories;
  } else if (activeView === 'trending') {
    displayStories = trendingStories;
  } else if (activeView === 'featured') {
    displayStories = featuredStories;
  }

  const WRITING_FORMATS = [
    { label: 'Novels', value: 'novel', icon: BookMarked },
    { label: 'Short Stories', value: 'short_story', icon: BookOpen },
    { label: 'Poetry', value: 'poetry', icon: Feather },
    { label: 'Plays', value: 'play', icon: Mic2 },
    { label: 'Screenplays', value: 'screenplay', icon: Film },
    { label: 'Memoirs', value: 'memoir', icon: ScrollText },
    { label: 'Novellas', value: 'novella', icon: BookText },
    { label: 'Flash Fiction', value: 'flash_fiction', icon: AlignLeft },
    { label: 'Spoken Word', value: 'spoken_word', icon: Mic2 },
    { label: 'Journals / Diaries', value: 'journal', icon: NotebookPen },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#d4580a' }}>Stories</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Discover stories from Baltimore's writing community.</p>
          </div>
          <Link to="/create-story" className="flex-shrink-0 ml-4">
            <Button variant="outline" className="gap-2 rounded-lg" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Write A Story</span>
            </Button>
          </Link>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Writing Formats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Browse by Format</h2>
        <div className="relative">
          <select
            value={activeCategory}
            onChange={e => { setActiveView('discover'); setActiveCategory(e.target.value); }}
            className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border-2 border-border bg-card text-foreground text-sm font-medium cursor-pointer focus:outline-none focus:border-foreground/40 transition-all"
          >
            <option value="all">All Formats</option>
            {WRITING_FORMATS.map(({ label, value }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveView('discover')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeView === 'discover'
              ? 'border-[#d4580a] text-[#d4580a]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Discover
        </button>
        <button
          onClick={() => setActiveView('trending')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeView === 'trending'
              ? 'border-[#d4580a] text-[#d4580a]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="w-4 h-4" />Trending
        </button>
        <button
          onClick={() => setActiveView('featured')}
          className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
            activeView === 'featured'
              ? 'border-[#d4580a] text-[#d4580a]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="w-4 h-4" />Featured
        </button>
      </div>

      {/* Category Filter */}
      {activeView === 'discover' && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#d4580a] text-white'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === 'all' ? 'All' : (WRITING_FORMATS.find(f => f.value === cat)?.label || cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}
            </button>
          ))}
        </div>
      )}

      {/* Stories Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : displayStories.length > 0 ? (
        <div className="space-y-4">
          {displayStories.map(story => (
            <div key={story.id} className="relative group">
              <StoryCard story={story} featured={activeView === 'featured'} />
              {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => muteMutation.mutate({ id: story.id, muted: story.visibility !== 'private' })}
                        className="gap-2 text-orange-600"
                      >
                        {story.visibility === 'private' ? <><Volume2 className="w-4 h-4" />Unmute Story</> : <><VolumeX className="w-4 h-4" />Mute Story</>}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { if (confirm(`Delete "${story.title}"? This cannot be undone.`)) deleteMutation.mutate(story.id); }}
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Story
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No stories found. Be the first to write one!</p>
        </div>
      )}
    </div>
  );
}