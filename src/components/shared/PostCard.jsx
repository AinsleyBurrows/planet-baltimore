import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Pencil, Trash2, Flag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AppImage from './AppImage';
import CommentSection from './CommentSection';
import { format } from 'date-fns';

export default function PostCard({ post, currentUserId, onLike, onDelete, onEdit }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const isOwner = currentUserId === post.author_id;

  const handleLike = () => {
    setLiked(!liked);
    onLike?.(post.id, !liked);
  };

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.author_id}`} className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-0.5">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback className="bg-accent/10 text-accent font-semibold text-sm">
              {post.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
              {post.author_name || 'Anonymous'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {post.neighborhood_name && <span>{post.neighborhood_name}</span>}
              {post.neighborhood_name && <span>·</span>}
              <span>{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
            </div>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 rounded-full hover:bg-secondary active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(post)}>
                  <Pencil className="w-4 h-4 mr-2" />Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(post.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete Post
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem><Share2 className="w-4 h-4 mr-2" />Share</DropdownMenuItem>
            <DropdownMenuItem><Bookmark className="w-4 h-4 mr-2" />Save</DropdownMenuItem>
            {!isOwner && <DropdownMenuItem><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div className={`${post.media_urls.length === 1 ? 'bg-white' : 'grid grid-cols-2 gap-0.5 bg-white'}`}>
          {post.media_urls.slice(0, 4).map((url, idx) => (
            <AppImage key={idx} src={url} images={post.media_urls} index={idx} className="w-full aspect-square" aspectRatio="square" />
          ))}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="px-4 pt-2 flex flex-wrap gap-1.5">
          {post.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs font-normal">#{tag}</Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            className={`flex items-center gap-1.5 text-sm transition-all duration-150 active:scale-90 ${liked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`w-5 h-5 transition-transform group-hover:scale-110 ${liked ? 'fill-accent' : ''}`} />
            <span>{(post.likes_count || 0) + (liked ? 1 : 0)}</span>
          </button>
          <button
            onClick={() => setShowComments(v => !v)}
            aria-label="Comment on post"
            className={`flex items-center gap-1.5 text-sm active:scale-90 transition-all duration-150 ${showComments ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageCircle className={`w-5 h-5 ${showComments ? 'fill-accent/20' : ''}`} />
            <span>{post.comments_count || 0}</span>
          </button>
          <button
            aria-label="Share post"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground active:scale-90 transition-all duration-150"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          aria-label={saved ? 'Unsave post' : 'Save post'}
          className={`transition-all duration-150 active:scale-90 ${saved ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Bookmark className={`w-5 h-5 ${saved ? 'fill-accent' : ''}`} />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          <CommentSection targetType="post" targetId={post.id} />
        </div>
      )}
    </article>
  );
}