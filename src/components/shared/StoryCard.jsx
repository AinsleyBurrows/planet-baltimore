import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AppImage from './AppImage';

export default function StoryCard({ story, featured = false }) {
  const navigate = useNavigate();

  const handleAuthorClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${story.author_id}`);
  };

  if (featured) {
    return (
      <Link to={`/stories/${story.id}`} className="block rounded-xl bg-card border border-border overflow-hidden hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="relative aspect-[2/1] bg-muted overflow-hidden">
          {story.cover_image ? (
            <AppImage src={story.cover_image} className="w-full h-full" clickable={false} />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
          )}
          {story.category && (
            <Badge variant="secondary" className="absolute top-3 left-3 bg-black/50 text-white border-0 backdrop-blur-sm text-xs capitalize">{story.category}</Badge>
          )}
        </div>
        <div className="p-5">
          <h2 className="text-xl font-serif font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2">{story.title}</h2>
          {story.subtitle && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{story.subtitle}</p>}
          <div className="flex items-center gap-3 mt-4 sm:mt-5">
            <button onClick={handleAuthorClick} className="flex-shrink-0">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                <AvatarImage src={story.author_avatar} />
                <AvatarFallback className="bg-accent/10 text-accent text-[10px] sm:text-xs">{story.author_name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </button>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground min-w-0">
              <button onClick={handleAuthorClick} className="font-medium text-foreground hover:text-accent transition-colors truncate">{story.author_name}</button>
              <span className="flex-shrink-0">·</span>
              <span className="flex-shrink-0">{story.reading_time || 5} min</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/stories/${story.id}`} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-card border border-border hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
          <button onClick={handleAuthorClick} className="flex-shrink-0">
            <Avatar className="w-6 h-6">
              <AvatarImage src={story.author_avatar} />
              <AvatarFallback className="bg-accent/10 text-accent text-[9px]">{story.author_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </button>
          <button onClick={handleAuthorClick} className="text-[11px] sm:text-xs font-medium text-foreground hover:text-accent transition-colors truncate">{story.author_name}</button>
          {story.category && <Badge variant="secondary" className="text-[9px] sm:text-[10px] capitalize">{story.category}</Badge>}
        </div>
        <h3 className="font-serif font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2 text-sm">{story.title}</h3>
        {story.subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">{story.subtitle}</p>}
        <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1 flex-shrink-0"><Clock className="w-3 h-3" />{story.reading_time || 5} min</div>
          <div className="flex items-center gap-1 flex-shrink-0"><Heart className="w-3 h-3" />{story.likes_count || 0}</div>
          <div className="flex items-center gap-1 flex-shrink-0"><MessageCircle className="w-3 h-3" />{story.comments_count || 0}</div>
        </div>
      </div>
      {story.cover_image && (
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 aspect-square">
          <AppImage src={story.cover_image} className="w-full h-full" clickable={false} aspectRatio="square" />
        </div>
      )}
    </Link>
  );
}