import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Clock, Share2, Trash2, Edit3, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AppImage from '@/components/shared/AppImage';
import CommentSection from '@/components/shared/CommentSection';
import ShareModal from '@/components/shared/ShareModal';
import StoryReactions from '@/components/writing/StoryReactions';
import SaveStoryButton from '@/components/writing/SaveStoryButton';
import WriterCard from '@/components/writing/WriterCard';

export default function StoryDetailV2() {
  const navigate = useNavigate();
  const storyId = window.location.pathname.split('/stories/')[1];
  const [user, setUser] = useState(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Story.delete(storyId),
    onSuccess: () => navigate('/stories'),
  });

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const stories = await base44.entities.Story.filter({ id: storyId });
      return stories[0];
    },
    enabled: !!storyId,
  });

  const { data: relatedStories = [] } = useQuery({
    queryKey: ['related-stories', story?.category],
    queryFn: () => base44.entities.Story.filter({ 
      status: 'published', 
      category: story.category,
    }, '-published_at', 5),
    enabled: !!story?.category && story?.id !== storyId,
  });

  if (isLoading) return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="aspect-[16/9] rounded-xl" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-96 w-full" />
    </div>
  );

  if (!story) return (
    <div className="text-center py-16">
      <h3 className="font-semibold text-foreground mb-1">Story not found</h3>
      <Button variant="ghost" onClick={() => navigate('/stories')} className="mt-4">Back to Stories</Button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main Content */}
      <article className="lg:col-span-3 space-y-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary inline-flex">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Hero Image */}
        {story.cover_image && (
          <div className="aspect-[16/9] rounded-2xl overflow-hidden">
            <AppImage src={story.cover_image} className="w-full h-full" clickable={false} />
          </div>
        )}

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {story.category && (
              <Badge variant="secondary" className="capitalize">{story.category.replace('_', ' ')}</Badge>
            )}
            {story.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">#{tag}</Badge>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-foreground leading-tight">
            {story.title}
          </h1>

          {story.subtitle && (
            <p className="text-xl text-muted-foreground">{story.subtitle}</p>
          )}
        </div>

        {/* Author & Meta */}
        <div className="flex items-center justify-between py-6 border-t border-b border-border">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarImage src={story.author_avatar} />
              <AvatarFallback className="bg-accent/10 text-accent font-bold">{story.author_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{story.author_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {story.published_at && <span>{format(new Date(story.published_at), 'MMM d, yyyy')}</span>}
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{story.reading_time || 5} min</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SaveStoryButton storyId={storyId} />
            <Button variant="ghost" size="icon" onClick={() => setShowShare(true)}>
              <Share2 className="w-5 h-5" />
            </Button>
            {user?.id === story.author_id && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/create-story?id=${storyId}`)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit3 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { if (window.confirm('Delete this story?')) deleteMutation.mutate(); }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: story.content }} />

        {/* Reactions */}
        <div className="py-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Reactions</h3>
            <span className="text-xs text-muted-foreground">{(story.likes_count || 0) + (story.views_count || 0)} total</span>
          </div>
          <StoryReactions storyId={storyId} />
        </div>

        {/* Comments */}
        <div className="py-6 border-t border-border space-y-6">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Discussion</h3>
          </div>
          <CommentSection targetType="story" targetId={storyId} />
        </div>

        {/* Related Stories */}
        {relatedStories.length > 0 && (
          <div className="py-6 border-t border-border space-y-6">
            <h3 className="text-lg font-semibold text-foreground">More from this category</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedStories.filter(s => s.id !== storyId).slice(0, 2).map(s => (
                <Card key={s.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {s.cover_image && (
                    <img src={s.cover_image} alt="" className="w-full aspect-[3/2] object-cover" />
                  )}
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-accent font-semibold">{s.reading_time || 5} min read</p>
                    <h4 className="font-semibold text-foreground line-clamp-2 hover:text-accent">
                      <a href={`/stories/${s.id}`}>{s.title}</a>
                    </h4>
                    <p className="text-xs text-muted-foreground">{s.author_name}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Sidebar */}
      <aside className="lg:col-span-1 space-y-6">
        <WriterCard authorId={story.author_id} authorName={story.author_name} authorAvatar={story.author_avatar} />
      </aside>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={window.location.href}
        title={story.title}
        description={story.subtitle}
      />
    </div>
  );
}