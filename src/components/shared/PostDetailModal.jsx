import React, { useState, useEffect, useCallback } from 'react';
import { X, Heart, MessageCircle, Share2, Bookmark, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ShareModal from './ShareModal';

const TEXT_BG_TEXT_COLORS = {
  '#1a1a2e': '#ffffff', '#16213e': '#ffffff', '#0f3460': '#ffffff',
  '#1b4332': '#ffffff', '#2d3a4a': '#ffffff', '#3d2b1f': '#ffffff',
  '#4a1942': '#ffffff', '#2c2c54': '#ffffff', '#1a1a1a': '#ffffff',
  '#f5f0e8': '#1a1a1a', '#fef9ef': '#1a1a1a', '#f0f4f8': '#1a1a1a',
  '#e8f4f8': '#1a1a1a', '#fdf6ec': '#1a1a1a',
  '#c9a96e': '#1a1a1a', '#d4a853': '#1a1a1a',
};

function getTextColor(bg) {
  return TEXT_BG_TEXT_COLORS[bg] || '#ffffff';
}

export default function PostDetailModal({ post, onClose }) {
  const [imgIndex, setImgIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const images = post?.media_urls || [];
  const isImage = post?.media_type === 'image' || (images.length > 0 && !post?.media_urls?.[0]?.match(/\.(mp4|webm|mov|avi)/i));
  const isVideo = post?.media_type === 'video' || post?.media_urls?.[0]?.match(/\.(mp4|webm|mov|avi)/i);
  const isText = !images.length || post?.media_type === 'text';
  const hasBg = !!post?.bg_color;

  const prev = useCallback(() => setImgIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setImgIndex(i => Math.min(images.length - 1, i + 1)), [images.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  if (!post) return null;

  const textColor = hasBg ? getTextColor(post.bg_color) : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-5xl max-h-[92vh] bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* LEFT: Media or text bg */}
          {!isText ? (
            <div className="relative md:w-[60%] bg-white flex items-center justify-center min-h-[300px] md:min-h-full">
              {isVideo ? (
            post.thumbnail_url ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img src={post.thumbnail_url} alt="video thumbnail" className="w-full h-full object-contain max-h-[60vh] md:max-h-[90vh]" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <video
                src={images[0]}
                controls
                className="w-full h-full object-contain max-h-[60vh] md:max-h-full"
              />
            )
          ) : (
                <>
                  <img
                    src={images[imgIndex]}
                    alt=""
                    className="w-full h-full object-contain max-h-[60vh] md:max-h-[90vh]"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        disabled={imgIndex === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={next}
                        disabled={imgIndex === images.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setImgIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          ) : (
            // Text-only post: styled editorial background
            <div
              className="md:w-[55%] flex items-center justify-center p-10 min-h-[280px] md:min-h-full"
              style={{ backgroundColor: post.bg_color || '#1a1a2e' }}
            >
              <p
                className="text-center text-2xl md:text-3xl font-serif leading-relaxed font-medium max-w-sm"
                style={{ color: textColor || '#ffffff' }}
              >
                {post.content}
              </p>
            </div>
          )}

          {/* RIGHT: Info panel */}
          <div className="flex flex-col md:w-[40%] overflow-y-auto">
            {/* Author */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Avatar className="w-9 h-9">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback className="bg-accent/10 text-accent text-sm font-bold">
                  {post.author_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{post.author_name || 'Anonymous'}</p>
                {post.neighborhood_name && <p className="text-xs text-muted-foreground">{post.neighborhood_name}</p>}
              </div>
            </div>

            {/* Caption (for media posts) */}
            {!isText && post.content && (
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-border">
                {post.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            )}

            {/* Date */}
            <div className="px-4 py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">
                {post.created_date ? format(new Date(post.created_date), 'MMMM d, yyyy · h:mm a') : ''}
              </span>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setLiked(l => !l)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-accent' : ''}`} />
                  <span>{(post.likes_count || 0) + (liked ? 1 : 0)}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
              <button
                onClick={() => setSaved(s => !s)}
                className={`transition-colors ${saved ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-accent' : ''}`} />
              </button>
            </div>

            {/* Comments placeholder */}
            <div className="px-4 py-4 flex-1">
              <p className="text-xs text-muted-foreground italic">Comments coming soon</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/profile/${post.author_id}`}
        title={post.content ? post.content.slice(0, 100) : `Post by ${post.author_name}`}
        description={post.content}
      />
    </AnimatePresence>
  );
}