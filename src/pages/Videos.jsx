import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Heart, MessageCircle, Share2, Search, Users, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import CommentSection from '@/components/shared/CommentSection';
import ShareModal from '@/components/shared/ShareModal';

/* ── Fullscreen lightbox ─────────────────────────────────────────── */
function VideoLightbox({ posts, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const videoRef = useRef(null);

  const post = posts[index];

  // Reset state when index changes
  useEffect(() => {
    setLiked(false);
    setLikesCount(posts[index]?.likes_count || 0);
    setShowComments(false);
    // Auto-play when switching
    setTimeout(() => videoRef.current?.play(), 100);
  }, [index, posts]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex(i => Math.min(posts.length - 1, i + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, posts.length]);

  const handleLike = async () => {
    const user = await base44.auth.me().catch(() => null);
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
    if (newLiked) {
      await base44.entities.Like.create({ user_id: user.id, target_type: 'post', target_id: post.id });
    } else {
      const likes = await base44.entities.Like.filter({ user_id: user.id, target_type: 'post', target_id: post.id });
      if (likes.length > 0) await base44.entities.Like.delete(likes[0].id);
    }
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={onClose}>
      {/* Close */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={onClose}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/60 text-sm font-medium">
        {index + 1} / {posts.length}
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={e => { e.stopPropagation(); setIndex(i => i - 1); }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next */}
      {index < posts.length - 1 && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={e => { e.stopPropagation(); setIndex(i => i + 1); }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main content */}
      <div
        className="flex flex-col lg:flex-row w-full h-full max-w-6xl mx-auto overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Video */}
        <div className="flex-1 flex items-center justify-center bg-black min-h-0 overflow-hidden">
          <video
            ref={videoRef}
            key={post.id}
            src={post.media_urls?.[0]}
            poster={post.thumbnail_url || undefined}
            className="w-full h-full object-contain"
            controls
            autoPlay
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>

        {/* Sidebar info */}
        <div className="lg:w-80 bg-card border-l border-border flex flex-col overflow-hidden shrink-0">
          {/* Author */}
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Link to={`/profile/${post.author_id}`} onClick={onClose}>
              <Avatar className="w-9 h-9">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">
                  {post.author_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${post.author_id}`} onClick={onClose} className="text-sm font-semibold text-foreground hover:text-accent transition-colors block truncate">
                {post.author_name || 'Anonymous'}
              </Link>
              <p className="text-xs text-muted-foreground">
                {post.neighborhood_name && `${post.neighborhood_name} · `}
                {post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy') : ''}
              </p>
            </div>
          </div>

          {/* Caption */}
          {post.content && (
            <div className="p-4 border-b border-border">
              <p className="text-sm text-foreground">{post.content}</p>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 border-b border-border flex items-center gap-5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <button
              onClick={() => setShowComments(v => !v)}
              className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments_count || 0}</span>
            </button>
            <button
              onClick={() => setShowShare(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            <CommentSection targetType="post" targetId={post.id} />
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/profile/${post.author_id}`}
        title={post.content?.slice(0, 100) || `Video by ${post.author_name}`}
      />
    </div>
  );
}

/* ── Thumbnail card (grid) ───────────────────────────────────────── */
function VideoCard({ post, onPlay }) {
  const videoUrl = post.media_urls?.[0];
  if (!videoUrl) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={onPlay}>
      {/* Thumbnail */}
      <div className="relative bg-black aspect-video">
        {post.thumbnail_url ? (
          <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <video
            src={videoUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 group-hover:bg-white/30 transition-colors">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.author_avatar} />
            <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">
              {post.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{post.author_name || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">
              {post.neighborhood_name && `${post.neighborhood_name} · `}
              {post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy') : ''}
            </p>
          </div>
        </div>
        {post.visibility === 'followers' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full mb-2">
            <Users className="w-3 h-3" /> Followers only
          </span>
        )}
        {post.content && (
          <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
        )}
      </div>
    </div>
  );
}

export default function Videos() {
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: videoPosts = [], isLoading } = useQuery({
    queryKey: ['video-posts'],
    queryFn: () => base44.entities.Post.filter({ media_type: 'video', is_deleted: false }, '-created_date', 50),
  });

  const { data: myFollows = [] } = useQuery({
    queryKey: ['my-follows', currentUser?.id],
    queryFn: () => base44.entities.Follow.filter({ follower_id: currentUser.id, target_type: 'user' }),
    enabled: !!currentUser?.id,
  });

  const followedUserIds = new Set(myFollows.map(f => f.target_id));

  const accessibleVideos = videoPosts.filter(p => {
    if (p.visibility !== 'followers') return true;
    if (!currentUser) return false;
    if (p.author_id === currentUser.id) return true;
    return followedUserIds.has(p.author_id);
  });

  const filtered = accessibleVideos.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.author_name?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      p.neighborhood_name?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Videos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All videos shared across Planet Baltimore</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Play className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-foreground font-medium">No videos yet</p>
          <p className="text-sm text-muted-foreground mt-1">Videos posted anywhere on the platform will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((post, i) => (
            <VideoCard key={post.id} post={post} onPlay={() => setLightboxIndex(i)} />
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <VideoLightbox
          posts={filtered}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}