import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Bookmark, MoreHorizontal, Trash2, Edit, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import CommentSection from '@/components/shared/CommentSection';
import ShareModal from '@/components/shared/ShareModal';
import AppImage from '@/components/shared/AppImage';

export default function StoryDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storyId = window.location.pathname.split('/stories/')[1];
  const [user, setUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: story, isLoading, error } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const results = await base44.entities.Story.filter({ id: storyId });
      return results[0];
    },
    enabled: !!storyId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Story.delete(storyId),
    onSuccess: () => {
      navigate('/stories');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Delete this story?')) {
      deleteMutation.mutate();
    }
  };

  const isOwner = user?.id === story?.author_id;

  if (isLoading) return (
    <div className="space-y-6">
      <Skeleton className="h-[400px] rounded-xl" />
      <Skeleton className="h-12 w-2/3" />
      <Skeleton className="h-48" />
    </div>
  );

  if (error || !story) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground mb-4">Story not found</p>
      <Button variant="outline" onClick={() => navigate('/stories')}>Back to Stories</Button>
    </div>
  );

  if (story.visibility === 'private' && !isOwner) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">This story is private</p>
        <Button variant="outline" onClick={() => navigate('/stories')}>Back to Stories</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-accent hover:underline mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Cover Image */}
      {story.cover_image && (
        <div className="rounded-xl overflow-hidden mb-8 aspect-video bg-muted">
          <AppImage src={story.cover_image} className="w-full h-full" clickable={false} aspectRatio="16:9" />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-2">{story.title}</h1>
            {story.subtitle && <p className="text-lg text-muted-foreground">{story.subtitle}</p>}
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-lg flex-shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/create-story?id=${storyId}`)}>
                  <Edit className="w-4 h-4 mr-2" />Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{story.reading_time || 5} min read</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{(story.views_count || 0).toLocaleString()} views</span>
          <span>·</span>
          <span>{story.published_at ? format(new Date(story.published_at), 'MMM d, yyyy') : ''}</span>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
          <Avatar className="w-10 h-10">
            <AvatarImage src={story.author_avatar} />
            <AvatarFallback className="bg-accent/10 text-accent">{story.author_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{story.author_name}</p>
            <p className="text-sm text-muted-foreground">Published {story.published_at ? format(new Date(story.published_at), 'MMM d, yyyy') : 'recently'}</p>
          </div>
        </div>
      </div>

      {/* Category & Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {story.category && <Badge variant="secondary" className="capitalize">{story.category}</Badge>}
        {story.tags?.map(tag => <Badge key={tag} variant="outline">#{tag}</Badge>)}
      </div>

      {/* Content */}
      <article className="prose prose-sm dark:prose-invert max-w-none mb-8">
        <div
          className="text-base leading-relaxed text-foreground whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: story.content }}
        />
      </article>

      {/* Actions */}
      <div className="flex items-center justify-between py-4 border-t border-b border-border mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLiked(!liked)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
              liked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-accent' : ''}`} />
            {(story.likes_count || 0) + (liked ? 1 : 0)}
          </button>
          <button
            onClick={() => setSaved(!saved)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
              saved ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${saved ? 'fill-accent' : ''}`} />
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShare(true)}
          className="gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </div>

      {/* Comments */}
      <CommentSection targetType="story" targetId={storyId} />

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/stories/${storyId}`}
        title={story.title}
        description={story.subtitle}
      />
    </div>
  );
}