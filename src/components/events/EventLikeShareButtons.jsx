import React, { useState, useEffect } from 'react';
import { Heart, Share2, Link, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EventLikeShareButtons({ event, className = '' }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(event?.likes_count || 0);
  const [copied, setCopied] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || !event?.id) return;
    base44.entities.Like.filter({ user_id: user.id, target_type: 'event', target_id: event.id })
      .then(likes => setLiked(likes.length > 0))
      .catch(() => {});
  }, [user, event?.id]);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { base44.auth.redirectToLogin(window.location.pathname); return; }
    if (liked) {
      const likes = await base44.entities.Like.filter({ user_id: user.id, target_type: 'event', target_id: event.id });
      if (likes[0]) await base44.entities.Like.delete(likes[0].id);
      setLiked(false);
      setLikeCount(c => Math.max(0, c - 1));
    } else {
      await base44.entities.Like.create({ user_id: user.id, target_type: 'event', target_id: event.id });
      setLiked(true);
      setLikeCount(c => c + 1);
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/events/${event.id}/tickets`;
    const shareData = { title: event.title, text: `Check out ${event.title}!`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} onClick={e => e.stopPropagation()}>
      <button
        onClick={handleLike}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
          ${liked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
        title={liked ? 'Unlike' : 'Like this event'}
      >
        <Heart className={`w-3.5 h-3.5 transition-all ${liked ? 'fill-red-500' : ''}`} />
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        title="Share event"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
        {copied ? <span className="text-green-600">Copied!</span> : <span>Share</span>}
      </button>
    </div>
  );
}