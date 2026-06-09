import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Pencil, Trash2, Flag, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import AppImage from './AppImage';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import EditPostModal from './EditPostModal';
import FoundingMemberBadge from './FoundingMemberBadge.jsx';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function FeedVideo({ src, thumbnail }) {
  const [playing, setPlaying] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const videoRef = useRef(null);

  const handlePlay = () => {
    document.querySelectorAll('video').forEach(v => {
      if (v !== videoRef.current) v.pause();
    });
    setPlaying(true);
    videoRef.current?.play();
  };

  const handleMetadata = () => {
    const v = videoRef.current;
    if (v) setIsPortrait(v.videoHeight > v.videoWidth);
  };

  return (
    <div className={`relative bg-black w-full ${isPortrait ? 'aspect-[9/16] max-h-[600px]' : 'aspect-video'}`}>
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail || undefined}
        className={`w-full h-full ${isPortrait ? 'object-cover' : 'object-contain'}`}
        controls={playing}
        preload="metadata"
        onLoadedMetadata={handleMetadata}
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

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function linkify(text) {
  if (!text) return null;
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-accent underline break-all hover:opacity-80" onClick={e => e.stopPropagation()}>
        {part}
      </a>
    ) : part
  );
}

function TruncatedText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const limit = 180;
  const isLong = text.length > limit;
  const displayText = isLong && !expanded ? text.slice(0, limit).trimEnd() + '…' : text;
  return (
    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
      {linkify(displayText)}
      {isLong && (
        <button onClick={() => setExpanded(v => !v)} className="ml-1 text-accent font-medium text-sm hover:underline focus-visible:outline-none">
          {expanded ? 'less' : 'more'}
        </button>
      )}
    </p>
  );
}

const PostCard = React.memo(function PostCard({ post, currentUserId, currentUser: currentUserProp, onLike, onDelete, onEdit }) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count || 0);
  const [showShare, setShowShare] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [localPost, setLocalPost] = useState(post);
  const [deleted, setDeleted] = useState(false);
  const [currentUser, setCurrentUser] = useState(currentUserProp || null);
  const queryClient = useQueryClient();
  const isOwner = currentUserId === post.author_id;

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    await base44.entities.Post.delete(post.id);
    setDeleted(true);
    onDelete?.(post.id);
    queryClient.invalidateQueries({ queryKey: ['home-posts'] });
  };
  const postUrl = `${window.location.origin}/profile/${post.author_id}`;
  const displayPost = localPost;

  // Only fetch auth if not passed as prop
  useEffect(() => {
    if (currentUserProp) {
      setCurrentUser(currentUserProp);
      return;
    }
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, [currentUserProp]);

  useEffect(() => {
    if (!currentUser) return;
    base44.entities.Like.filter({ user_id: currentUser.id, target_type: 'post', target_id: post.id })
      .then(likes => setLiked(likes.length > 0))
      .catch(() => {});
  }, [currentUser?.id, post.id]);

  const { data: savedRecords = [] } = useQuery({
    queryKey: ['saved-post', post.id, currentUser?.id],
    queryFn: () => base44.entities.SavedPost.filter({ user_id: currentUser.id, post_id: post.id }),
    enabled: !!currentUser?.id,
  });

  const isSaved = savedRecords.length > 0;

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await base44.entities.SavedPost.delete(savedRecords[0].id);
      } else {
        await base44.entities.SavedPost.create({ user_id: currentUser.id, post_id: post.id, saved_at: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-post', post.id, currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts-profile', currentUser?.id] });
    },
  });

  const handleLike = async () => {
    if (!currentUser) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLocalLikesCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
    if (newLiked) {
      await base44.entities.Like.create({ user_id: currentUser.id, target_type: 'post', target_id: post.id });
      await base44.entities.Post.update(post.id, { likes_count: localLikesCount + 1 });
    } else {
      const likes = await base44.entities.Like.filter({ user_id: currentUser.id, target_type: 'post', target_id: post.id });
      if (likes.length > 0) await base44.entities.Like.delete(likes[0].id);
      await base44.entities.Post.update(post.id, { likes_count: Math.max(0, localLikesCount - 1) });
    }
    onLike?.(post.id, newLiked);
  };

  if (deleted) return null;

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <Link to={`/profile/${post.author_id}`} className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-0.5 flex-1 min-w-0">
          <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback className="bg-accent/10 text-accent font-semibold text-xs sm:text-sm">
              {post.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                {post.author_name || 'Anonymous'}
              </p>
              {post.author_is_founding_member && <FoundingMemberBadge />}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
              {post.neighborhood_name && <span className="truncate">{post.neighborhood_name}</span>}
              {post.neighborhood_name && <span className="flex-shrink-0">·</span>}
              <span className="flex-shrink-0">{post.created_date ? format(new Date(post.created_date), 'MMM d') : ''}</span>
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
                <DropdownMenuItem onClick={() => setShowEdit(true)}>
                  <Pencil className="w-4 h-4 mr-2" />Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete Post
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onClick={() => setShowShare(true)}><Share2 className="w-4 h-4 mr-2" />Share</DropdownMenuItem>
            {!isOwner && (
              <DropdownMenuItem className="text-destructive" onClick={() => alert('Thank you for reporting. Our team will review this post.')}>
                <Flag className="w-4 h-4 mr-2" />Report
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content + Media */}
      {(() => {
        const hasText = !!displayPost.content && !displayPost.bg_color;
        const firstUrl = displayPost.media_urls?.[0] || '';
        const isVideoUrl = /\.(mp4|webm|mov|avi)/i.test(firstUrl);
        const isVideo = displayPost.media_urls?.length > 0 && (displayPost.media_type === 'video' || isVideoUrl);
        const hasImages = displayPost.media_urls?.length > 0 && !isVideo;
        const singleImage = hasImages && displayPost.media_urls.length === 1;

        // Audio post
        if (displayPost.media_type === 'audio' && displayPost.media_urls?.length > 0) {
          return (
            <div className="space-y-0">
              {displayPost.thumbnail_url && (
                <img src={displayPost.thumbnail_url} alt="Audio thumbnail" className="w-full aspect-video object-cover" />
              )}
              <div className="px-4 pt-3 pb-3 space-y-3">
                {displayPost.content && <TruncatedText text={displayPost.content} />}
                {displayPost.media_urls.map((url, idx) => (
                  <div key={idx} className="flex flex-col gap-1 bg-secondary/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="text-lg">🎵</span>
                      <span className="truncate font-medium text-foreground">Audio Track</span>
                    </div>
                    <audio src={url} controls className="w-full h-10" preload="metadata" />
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // Colored text frame post
        if (displayPost.bg_color && displayPost.content) {
          return (
            <div
              className="mx-4 mb-3 rounded-xl flex items-center justify-center p-6 min-h-[180px]"
              style={{ backgroundColor: displayPost.bg_color }}
            >
              <p className="font-serif text-xl leading-snug font-medium text-center" style={{ color: getTextColor(displayPost.bg_color) }}>
                {displayPost.content}
              </p>
            </div>
          );
        }

        // Single image + text: image on top, text below
        if (hasText && singleImage) {
          const fit0 = displayPost.media_fits?.[0] || 'cover';
          return (
            <div>
              {fit0 === 'contain' ? (
                <img src={displayPost.media_urls[0]} alt="" className="w-full max-h-[400px] object-contain bg-secondary" onClick={() => {}} />
              ) : (
                <AppImage src={displayPost.media_urls[0]} images={displayPost.media_urls} index={0} className="w-full" aspectRatio="16:9" />
              )}
              <div className="px-4 pt-3 pb-2">
                <TruncatedText text={displayPost.content} />
              </div>
            </div>
          );
        }

        // Video (must come before text-only check)
        if (isVideo) {
          return (
            <div>
              <FeedVideo src={displayPost.media_urls[0]} thumbnail={displayPost.thumbnail_url} />
              {hasText && (
                <div className="px-4 pt-3 pb-2">
                  <TruncatedText text={displayPost.content} />
                </div>
              )}
            </div>
          );
        }

        // Text only
        if (hasText) {
          return (
            <div className="px-4 pb-3">
              <TruncatedText text={displayPost.content} />
            </div>
          );
        }

        // Multiple images + optional text below
        if (hasImages) {
          return (
            <div>
              <div className={`grid gap-0.5 bg-secondary ${displayPost.media_urls.length === 1 ? '' : 'grid-cols-2'}`}>
                {displayPost.media_urls.slice(0, 4).map((url, idx) => {
                  const fit = displayPost.media_fits?.[idx] || 'cover';
                  return fit === 'contain' ? (
                    <img key={idx} src={url} alt="" className="w-full max-h-[400px] object-contain bg-secondary" />
                  ) : (
                    <AppImage key={idx} src={url} images={displayPost.media_urls} index={idx} className="w-full aspect-square" aspectRatio="square" />
                  );
                })}
              </div>
              {hasText && (
                <div className="px-4 pt-3 pb-2">
                  <TruncatedText text={displayPost.content} />
                </div>
              )}
            </div>
          );
        }

        return null;
      })()}

      {/* Tags */}
      {displayPost.tags?.length > 0 && (
        <div className="px-3 sm:px-4 pt-2 flex flex-wrap gap-1">
          {displayPost.tags.map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs font-normal">#{tag}</Badge>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={handleLike}
            aria-label={liked ? 'Unlike post' : 'Like post'}
            className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm transition-all duration-150 active:scale-90 ${liked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 ${liked ? 'fill-[#d4580a] text-[#d4580a]' : ''}`} />
            <span>{localLikesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(v => !v)}
            aria-label="Comment on post"
            className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm active:scale-90 transition-all duration-150 ${showComments ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${showComments ? 'fill-accent/20' : ''}`} />
            <span className="hidden sm:inline">{post.comments_count || 0}</span>
          </button>
          <button
            onClick={() => setShowShare(true)}
            aria-label="Share post"
            className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground active:scale-90 transition-all duration-150"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        {currentUser && (
          <button
            onClick={() => toggleSaveMutation.mutate()}
            disabled={toggleSaveMutation.isPending}
            aria-label={isSaved ? 'Unsave post' : 'Save post'}
            className={`transition-all duration-150 active:scale-90 ${isSaved ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-accent' : ''}`} />
          </button>
        )}
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
        title={displayPost.content ? displayPost.content.slice(0, 100) : `Post by ${displayPost.author_name}`}
        description={displayPost.content}
      />

      {showEdit && (
        <EditPostModal
          post={displayPost}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setLocalPost(updated)}
        />
      )}
    </article>
  );
});

export default PostCard;