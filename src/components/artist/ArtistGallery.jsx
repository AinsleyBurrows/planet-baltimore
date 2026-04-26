import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function ArtistGallery({ portfolioUrls = [], posts = [], isOwner = false, artist = null }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const queryClient = useQueryClient();

  // Combine portfolio images + post media into one flat list
  // Each item tracks its source for deletion
  const portfolioItems = portfolioUrls.map(url => ({ url, caption: null, type: 'portfolio' }));
  const postMedia = posts.flatMap(p =>
    (p.media_urls || []).map(url => ({ url, caption: p.content?.slice(0, 80), type: 'post', postId: p.id }))
  );
  const [items, setItems] = useState([...portfolioItems, ...postMedia]);

  // Keep items in sync when props change (re-derive on mount only via key)
  const allItems = [...portfolioItems, ...postMedia];

  const handleDelete = async (e, idx) => {
    e.stopPropagation();
    if (!window.confirm('Remove this image?')) return;
    const item = allItems[idx];
    if (item.type === 'portfolio' && artist) {
      // Remove from portfolio_urls array
      const newUrls = (artist.portfolio_urls || []).filter(u => u !== item.url);
      await base44.entities.ArtistPage.update(artist.id, { portfolio_urls: newUrls });
      queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    } else if (item.type === 'post') {
      await base44.entities.Post.delete(item.postId);
      queryClient.invalidateQueries({ queryKey: ['artist-posts', artist?.owner_id] });
    }
    if (lightboxIdx === idx) setLightboxIdx(null);
  };

  if (allItems.length === 0) {
    return (
      <div className="text-center py-14 text-muted-foreground text-sm">
        No gallery works yet.
      </div>
    );
  }

  const prev = () => setLightboxIdx(i => (i - 1 + allItems.length) % allItems.length);
  const next = () => setLightboxIdx(i => (i + 1) % allItems.length);

  return (
    <>
      {/* Masonry-style grid: 3 cols */}
      <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
        {allItems.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
            className={`relative overflow-hidden bg-muted group cursor-pointer ${
              idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
            }`}
            onClick={() => setLightboxIdx(idx)}
          >
            <img
              src={item.url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {isOwner && (
              <button
                onClick={(e) => handleDelete(e, idx)}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative max-w-3xl w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={allItems[lightboxIdx].url}
                alt=""
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
              {allItems[lightboxIdx].caption && (
                <p className="text-white/70 text-sm text-center mt-3 px-4">{allItems[lightboxIdx].caption}</p>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                {isOwner && (
                  <button onClick={(e) => handleDelete(e, lightboxIdx)} className="p-2 rounded-full bg-black/50 text-white hover:bg-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setLightboxIdx(null)} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {allItems.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <p className="text-white/50 text-xs text-center mt-2">{lightboxIdx + 1} / {allItems.length}</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}