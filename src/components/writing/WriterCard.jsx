import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Heart } from 'lucide-react';

export default function WriterCard({ authorId, authorName, authorAvatar }) {
  const { data: profile } = useQuery({
    queryKey: ['writer-profile', authorId],
    queryFn: () => base44.entities.WriterProfile.filter({ user_id: authorId }),
    enabled: !!authorId,
  });

  const writer = profile?.[0];

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Link to={`/profile/${authorId}`} className="flex items-center gap-3 flex-1 group">
          <Avatar className="w-12 h-12">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback className="bg-accent/10 text-accent font-bold">{authorName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">{authorName}</h3>
            {writer?.published_stories_count && (
              <p className="text-xs text-muted-foreground">{writer.published_stories_count} stories</p>
            )}
          </div>
        </Link>
      </div>

      {writer?.bio && (
        <p className="text-sm text-muted-foreground line-clamp-3">{writer.bio}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {writer?.total_views ? (
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{writer.total_views.toLocaleString()} views</span>
          </div>
        ) : null}
        {writer?.total_likes ? (
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span>{writer.total_likes.toLocaleString()}</span>
          </div>
        ) : null}
      </div>

      {writer?.newsletter_enabled && (
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm">
          Subscribe to newsletter
        </Button>
      )}

      <Link to={`/profile/${authorId}`}>
        <Button variant="outline" className="w-full rounded-lg text-sm">
          View profile
        </Button>
      </Link>
    </div>
  );
}