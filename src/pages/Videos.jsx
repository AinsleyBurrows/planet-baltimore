import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Heart, MessageCircle, Share2, Search, Users, X, Trash2, Star, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import CommentSection from '@/components/shared/CommentSection';
import ShareModal from '@/components/shared/ShareModal';
import ReportModal from '@/components/shared/ReportModal';

/* ── Up Next sidebar row ─────────────────────────────────────────── */
function UpNextRow({ post, onClick, isActive }) {
  const videoUrl = post.media_urls?.[0];
  if (!videoUrl) return null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex gap-3 p-2 rounded-lg text-left transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
    >
      <div className="relative w-36 shrink-0 aspect-video rounded-md overflow-hidden bg-black">
        {post.thumbnail_url ? (
          <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <video src={videoUrl} className="w-full h-full object-cover" preload="metadata" muted />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-5 h-5 text-white fill-white opacity-80" />
        </div>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
          {post.content || 'Untitled video'}
        </p>
        <p className="text-xs text-white/50 mt-1 truncate">{post.author_name}</p>
        {post.neighborhood_name && (
          <p className="text-xs text-white/40 truncate">{post.neighborhood_name}</p>
        )}
      </div>
    </button>
  );
}

/* ── Fullscreen player (YouTube-style) ──────────────────────────── */
function VideoLightbox({ posts, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const videoRef = useRef(null);
  const mainRef = useRef(null);

  const post = posts[index];
  // Other videos for the "Up Next" sidebar
  const otherVideos = posts.filter((_, i) => i !== index);

  useEffect(() => {
    setLiked(false);
    setLikesCount(posts[index]?.likes_count || 0);
    setShowFullDesc(false);
    // Scroll main area back to top on switch
    if (mainRef.current) mainRef.current.scrollTop = 0;
    setTimeout(() => videoRef.current?.play(), 100);
  }, [index, posts]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    <div className="fixed inset-0 z-50 bg-[#0f0f0f] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">Planet Baltimore</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="text-white/50 text-xs">{index + 1} of {posts.length}</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body: main + sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: scrollable main column ── */}
        <div ref={mainRef} className="flex-1 overflow-y-auto">
          {/* Video player */}
          <div className="w-full bg-black">
            <video
              ref={videoRef}
              key={post.id}
              src={post.media_urls?.[0]}
              poster={post.thumbnail_url || undefined}
              className="w-full aspect-video object-contain max-h-[70vh]"
              controls
              autoPlay
            />
          </div>

          {/* Info below player */}
          <div className="px-4 md:px-6 py-4 max-w-4xl">
            {/* Title / caption */}
            <div className="mb-3">
              <p className={`text-white font-semibold text-base leading-snug ${showFullDesc ? '' : 'line-clamp-2'}`}>
                {post.content || 'Untitled video'}
              </p>
              {post.content && post.content.length > 120 && (
                <button
                  onClick={() => setShowFullDesc(v => !v)}
                  className="text-white/50 text-xs mt-1 hover:text-white/80 transition-colors"
                >
                  {showFullDesc ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Author row + actions */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-white/10">
              {/* Author */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Link to={`/profile/${post.author_id}`} onClick={onClose}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={post.author_avatar} />
                    <AvatarFallback className="bg-white/10 text-white text-sm font-bold">
                      {post.author_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0">
                  <Link to={`/profile/${post.author_id}`} onClick={onClose} className="text-white font-semibold text-sm hover:text-white/80 transition-colors block truncate">
                    {post.author_name || 'Anonymous'}
                  </Link>
                  <p className="text-white/50 text-xs truncate">
                    {[post.neighborhood_name, post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy') : null].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${liked ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-black' : ''}`} />
                  <span>{likesCount}</span>
                </button>
                <button
                  onClick={() => setShowShare(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 text-sm font-medium transition-colors"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report</span>
                </button>
              </div>
            </div>

            {/* Comments */}
            <div className="pt-4">
              <p className="text-white font-semibold text-sm mb-4">
                {post.comments_count || 0} Comment{post.comments_count !== 1 ? 's' : ''}
              </p>
              <CommentSection targetType="post" targetId={post.id} />
            </div>
          </div>
        </div>

        {/* ── Right: Up Next sidebar (desktop only) ── */}
        {otherVideos.length > 0 && (
          <div className="hidden lg:flex flex-col w-96 shrink-0 border-l border-white/10 overflow-y-auto">
            <div className="p-4 pb-2">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Up Next</p>
            </div>
            <div className="px-2 pb-4 space-y-1">
              {otherVideos.map((p) => {
                const realIndex = posts.indexOf(p);
                return (
                  <UpNextRow
                    key={p.id}
                    post={p}
                    isActive={false}
                    onClick={() => setIndex(realIndex)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/profile/${post.author_id}`}
        title={post.content?.slice(0, 100) || `Video by ${post.author_name}`}
      />
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="post"
        targetId={post.id}
        targetName={post.content?.slice(0, 80) || `Video by ${post.author_name}`}
      />
    </div>
  );
}

/* ── Thumbnail card (grid) ───────────────────────────────────────── */
function VideoCard({ post, onPlay, currentUserId, isAdmin, onDelete, onToggleFeature }) {
  const [showReport, setShowReport] = useState(false);
  const videoUrl = post.media_urls?.[0];
  const isOwner = currentUserId && post.author_id === currentUserId;
  if (!videoUrl) return null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('Delete this video?')) return;
    await base44.entities.Post.update(post.id, { is_deleted: true });
    onDelete();
  };

  const handleToggleFeature = async (e) => {
    e.stopPropagation();
    await base44.entities.Post.update(post.id, { is_pinned: !post.is_pinned });
    onToggleFeature();
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer group relative" onClick={onPlay}>
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
        {/* Admin feature button */}
        {isAdmin && (
          <button
            onClick={handleToggleFeature}
            className={`absolute top-2 left-2 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${post.is_pinned ? 'bg-yellow-500 text-white' : 'bg-black/60 text-white hover:bg-yellow-500'}`}
            title={post.is_pinned ? 'Unfeature video' : 'Feature video'}
          >
            <Star className={`w-4 h-4 ${post.is_pinned ? 'fill-current' : ''}`} />
          </button>
        )}
        {/* Featured badge — only shown to non-admins */}
        {post.is_pinned && !isAdmin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500 text-white text-[11px] font-semibold">
            <Star className="w-3 h-3 fill-current" /> Featured
          </div>
        )}
        {isOwner && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
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
            <Link
              to={`/profile/${post.author_id}`}
              onClick={e => e.stopPropagation()}
              className="text-sm font-semibold text-foreground hover:text-accent transition-colors truncate block"
            >
              {post.author_name || 'Anonymous'}
            </Link>
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
        {!isOwner && (
          <button
            onClick={e => { e.stopPropagation(); setShowReport(true); }}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            <Flag className="w-3 h-3" /> Report
          </button>
        )}
      </div>
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="post"
        targetId={post.id}
        targetName={post.content?.slice(0, 80) || `Video by ${post.author_name}`}
      />
    </div>
  );
}

const CATEGORIES = ['All', 'Music', 'Visual Art', 'Events', 'Community', 'Dance & Performance', 'Food & Nightlife', 'News'];

export default function Videos() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [category, setCategory] = useState('All');
  const [currentUser, setCurrentUser] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      setIsAdmin(u?.role === 'admin');
    }).catch(() => {});
  }, []);

  const { data: videoPosts = [], isLoading } = useQuery({
    queryKey: ['video-posts'],
    queryFn: () => base44.entities.Post.filter({ media_type: 'video', is_deleted: false }, '-created_date', 100),
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

  const searchFiltered = accessibleVideos.filter(p => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || (
      p.author_name?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      p.neighborhood_name?.toLowerCase().includes(q) ||
      p.tags?.some(t => t.toLowerCase().includes(q))
    );
    const matchesCategory = category === 'All' || p.tags?.some(t => t.toLowerCase() === category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Admin-featured (pinned) videos shown first
  const featured = searchFiltered.filter(p => p.is_pinned);
  // Non-featured sorted by sort selection
  const nonFeatured = searchFiltered.filter(p => !p.is_pinned);
  const sorted = [...nonFeatured].sort((a, b) => {
    if (sort === 'popular') return (b.likes_count || 0) - (a.likes_count || 0);
    return new Date(b.created_date) - new Date(a.created_date);
  });

  // All videos in lightbox order: featured first, then sorted rest
  const allOrdered = [...featured, ...sorted];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: '#d4580a' }}>Videos</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Watch videos shared across Planet Baltimore.</p>
          </div>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search videos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
      ) : searchFiltered.length === 0 ? (
        <div className="text-center py-20">
          <Play className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-foreground font-medium">No videos yet</p>
          <p className="text-sm text-muted-foreground mt-1">Videos posted anywhere on the platform will appear here.</p>
        </div>
      ) : (
        <>
          {/* Featured Row — admin-pinned */}
          {featured.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold text-foreground">Featured Videos</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featured.map((post, i) => (
                  <VideoCard
                    key={post.id}
                    post={post}
                    onPlay={() => setLightboxIndex(i)}
                    currentUserId={currentUser?.id}
                    isAdmin={isAdmin}
                    onDelete={() => queryClient.invalidateQueries({ queryKey: ['video-posts'] })}
                    onToggleFeature={() => queryClient.invalidateQueries({ queryKey: ['video-posts'] })}
                  />
                ))}
              </div>
            </>
          )}

          {/* Divider + Sort & Category Controls */}
          {sorted.length > 0 && (
            <>
              <div className="border-t border-border" />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSort('newest')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${sort === 'newest' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                >
                  Newest
                </button>
                <button
                  onClick={() => setSort('popular')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${sort === 'popular' ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
                >
                  Most Popular
                </button>
                <div className="w-px h-5 bg-border mx-1 shrink-0" />
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(category === cat ? 'All' : cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                      category === cat
                        ? 'text-primary-foreground border-transparent'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                    style={category === cat ? { backgroundColor: '#d4580a', borderColor: '#d4580a' } : {}}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* 3-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((post, i) => (
                  <VideoCard
                    key={post.id}
                    post={post}
                    onPlay={() => setLightboxIndex(featured.length + i)}
                    currentUserId={currentUser?.id}
                    isAdmin={isAdmin}
                    onDelete={() => queryClient.invalidateQueries({ queryKey: ['video-posts'] })}
                    onToggleFeature={() => queryClient.invalidateQueries({ queryKey: ['video-posts'] })}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {lightboxIndex !== null && (
        <VideoLightbox
          posts={allOrdered}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}