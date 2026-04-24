import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function StoryViewer({ stories, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const DURATION = 5000;

  const story = stories[current];

  const goNext = () => {
    if (current < stories.length - 1) {
      setCurrent(c => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    setProgress(0);
    clearInterval(intervalRef.current);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        goNext();
      }
    }, 50);
    return () => clearInterval(intervalRef.current);
  }, [current]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-full max-h-[100dvh] sm:max-h-[90vh] sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Media */}
        {story.media_type === 'video' ? (
          <video src={story.media_url} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <img src={story.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/40" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1">
          {stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: idx < current ? '100%' : idx === current ? `${progress}%` : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Author */}
        <div className="absolute top-8 left-3 right-10 flex items-center gap-2.5">
          <Avatar className="w-9 h-9 border-2 border-white">
            <AvatarImage src={story.author_avatar} />
            <AvatarFallback className="bg-accent text-white text-xs font-bold">
              {story.author_name?.charAt(0) || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white text-sm font-semibold leading-none">{story.author_name}</p>
            <p className="text-white/70 text-xs mt-0.5">
              {story.created_date ? formatDistanceToNow(new Date(story.created_date), { addSuffix: true }) : ''}
            </p>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-8 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-6 left-4 right-4">
            <p className="text-white text-sm leading-relaxed drop-shadow-md">{story.caption}</p>
          </div>
        )}

        {/* Tap zones */}
        <button className="absolute left-0 top-0 w-1/3 h-full focus:outline-none" onClick={goPrev} aria-label="Previous story" />
        <button className="absolute right-0 top-0 w-1/3 h-full focus:outline-none" onClick={goNext} aria-label="Next story" />
      </div>
    </motion.div>
  );
}