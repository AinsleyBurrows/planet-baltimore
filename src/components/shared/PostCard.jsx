import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Pencil, Trash2, Flag, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AppImage from './AppImage';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import { format } from 'date-fns';

function FeedVideo({ src, thumbnail }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  return (
    <div className="relative bg-black aspect-video">
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail || undefined}
        className="w-full h-full object-cover"
        controls={playing}
        preload="metadata"
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
          onClick={handlePlay}
        >
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 hover:bg-white/30 transition-colors">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

const TEXT_COLOR_MAP = {
  '#1a1a2e': '#ffffff', '#16213e': '#ffffff', '#0f3460': '#ffffff',
  '#1b4332': '#ffffff', '#2d3a4a': '#ffffff', '#3d2b1f': '#ffffff',
  '#4a1942': '#ffffff', '#2c2c54': '#ffffff', '#1a1a1a': '#ffffff',
  '#f5f0e8': '#1a1a1a', '#fef9ef': '#1a1a1a', '#f0f4f8': '#1a1a1a',
  '#e8f4f8': '#1a1a1a', '#fdf6ec': '#1a1a1a',
  '#c9a96e': '#1a1a1a', '#d4a853': '#1a1a1a',
};
const getTextColor = (bg) => TEXT_COLOR_MAP[bg] || '#ffffff';

export default function PostCard({ post, currentUserId, onLike, onDelete, onEdit }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const isOwner = currentUserId === post.author_id;
  const postUrl = `${window.location.origin}/profile/${post.author_id}`;

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
            <DropdownMenuItem onClick={() => setShowShare(true)}><Share2 className="w-4 h-4 mr-2" />Share</DropdownMenuItem>
            <DropdownMenuItem><Bookmark className="w-4 h-4 mr-2" />Save</DropdownMenuItem>
            {!isOwner && <DropdownMenuItem><Flag className="w-4 h-4 mr-2" />Report</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content + Media */}
      {(() => {
        const hasText = !!post.content && !post.bg_color;
        const hasImages = post.media_urls?.length > 0 && post.media_type !== 'video';
        const isVideo = post.media_urls?.length > 0 && post.media_type === 'video';
        const singleImage = hasImages && post.media_urls.length === 1;

        // Colored text frame post
        if (post.bg_color && post.content) {
          return (
            <div
              className="mx-4 mb-3 rounded-xl flex items-center justify-center p-6 min-h-[180px]"
              style={{ backgroundColor: post.bg_color }}
            >
              <p className="font-serif text-xl leading-snug font-medium text-center" style={{ color: getTextColor(post.bg_color) }}>
                {post.content}
              </p>
            </div>
          );
        }

        // Single image + text: side-by-side layout
        if (hasText && singleImage) {
          return (
            <div className="flex gap-0 overflow-hidden">
              <div className="flex-1 px-4 pb-3 flex items-center">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>
              <div className="w-40 flex-shrink-0">
                <AppImage src={post.media_urls[0]} images={post.media_urls} index={0} className="w-full h-full" aspectRatio="square" />
              </div>
            </div>
          );
        }

        // Text only
        if (hasText) {
          return (
            <div className="px-4 pb-3">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
          );
        }

        // Video
        if (isVideo) {
          return <FeedVideo src={post.media_urls[0]} thumbnail={post.thumbnail_url} />;
        }

        // Multiple images (no text above, or text already handled)
        if (hasImages) {
          return (
            <div className="grid grid-cols-2 gap-0.5 bg-white">
              {post.media_urls.slice(0, 4).map((url, idx) => (
                <AppImage key={idx} src={url} images={post.media_urls} index={idx} className="w-full aspect-square" aspectRatio="square" />
              ))}
            </div>
          );
        }

        return null;
      })()}

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
            onClick={() => setShowShare(true)}
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

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={postUrl}
        title={post.content ? post.content.slice(0, 100) : `Post by ${post.author_name}`}
        description={post.content}
      />
    </article>
  );
}