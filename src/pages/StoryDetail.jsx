import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Clock, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AppImage from '@/components/shared/AppImage';

export default function StoryDetail() {
  const navigate = useNavigate();
  const storyId = window.location.pathname.split('/stories/')[1];

  const { data: story, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const stories = await base44.entities.Story.filter({ id: storyId });
      return stories[0];
    },
    enabled: !!storyId,
  });

  if (isLoading) return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Skeleton className="aspect-[2/1] rounded-xl" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
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
    <article className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary mb-4"><ArrowLeft className="w-5 h-5" /></button>

      {/* Cover Image */}
      {story.cover_image && (
        <div className="aspect-[2/1] rounded-xl overflow-hidden mb-8">
          <AppImage src={story.cover_image} className="w-full h-full" />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        {story.category && <Badge variant="secondary" className="mb-3 capitalize">{story.category.replace('_', ' ')}</Badge>}
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground leading-tight">{story.title}</h1>
        {story.subtitle && <p className="text-lg text-muted-foreground mt-3">{story.subtitle}</p>}

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
          <Avatar className="w-12 h-12">
            <AvatarImage src={story.author_avatar} />
            <AvatarFallback className="bg-accent/10 text-accent font-semibold">{story.author_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{story.author_name}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {story.published_at && <span>{format(new Date(story.published_at), 'MMM d, yyyy')}</span>}
              <span>·</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{story.reading_time || 5} min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: story.content }} />

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-12 pt-6 border-t border-border">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors"><Heart className="w-5 h-5" />{story.likes_count || 0}</button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors"><MessageCircle className="w-5 h-5" />{story.comments_count || 0}</button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon"><Share2 className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon"><Bookmark className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Author CTA */}
      <div className="mt-8 p-6 bg-secondary/50 rounded-xl text-center">
        <Avatar className="w-16 h-16 mx-auto mb-3">
          <AvatarImage src={story.author_avatar} />
          <AvatarFallback className="bg-accent/10 text-accent font-bold text-lg">{story.author_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-foreground">Written by {story.author_name}</h3>
        <p className="text-sm text-muted-foreground mt-1">Follow for more stories from Baltimore</p>
        <Button className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">Follow</Button>
      </div>
    </article>
  );
}