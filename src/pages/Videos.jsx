import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Heart, MessageCircle, Share2, Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import CommentSection from '@/components/shared/CommentSection';
import ShareModal from '@/components/shared/ShareModal';

function VideoCard({ post }) {
  const [playing, setPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const videoRef = useRef(null);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

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

  const videoUrl = post.media_urls?.[0];
  if (!videoUrl) return null;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Video Player */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={post.thumbnail_url || undefined}
          className="w-full h-full object-cover"
          controls={playing}
          preload="metadata"
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />
        {!playing && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 hover:bg-white/30 transition-colors">
              <Play className="w-8 h-8 text-white fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-3 mb-2">
          <Link to={`/profile/${post.author_id}`}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={post.author_avatar} />
              <AvatarFallback className="bg-accent/10 text-accent text-xs font-semibold">
                {post.author_name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${post.author_id}`} className="text-sm font-semibold text-foreground hover:text-accent transition-colors truncate block">
              {post.author_name || 'Anonymous'}
            </Link>
            <p className="text-xs text-muted-foreground">
              {post.neighborhood_name && `${post.neighborhood_name} · `}
              {post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy') : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          {post.visibility === 'followers' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              <Users className="w-3 h-3" /> Followers only
            </span>
          )}
        </div>
        {post.content && (
          <p className="text-sm text-foreground mb-3 line-clamp-2">{post.content}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors active:scale-90 ${liked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span>{likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(v => !v)}
            className={`flex items-center gap-1.5 text-sm transition-colors active:scale-90 ${showComments ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count || 0}</span>
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-90"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t border-border">
            <CommentSection targetType="post" targetId={post.id} />
          </div>
        )}
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

export default function Videos() {
  const [search, setSearch] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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
          {filtered.map(post => (
            <VideoCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}