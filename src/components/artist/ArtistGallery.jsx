import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import AppImage from '@/components/shared/AppImage';

export default function ArtistGallery({ portfolioUrls = [], posts = [] }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Combine portfolio images + post media into one flat list
  const postMedia = posts.flatMap(p =>
    (p.media_urls || []).map(url => ({ url, caption: p.content?.slice(0, 80) }))
  );
  const portfolioItems = portfolioUrls.map(url => ({ url, caption: null }));
  const items = [...portfolioItems, ...postMedia];

  if (items.length === 0) {
    return (
      <div className="text-center py-14 text-muted-foreground text-sm">
        No gallery works yet.
      </div>
    );
  }

  const prev = () => setLightboxIdx(i => (i - 1 + items.length) % items.length);
  const next = () => setLightboxIdx(i => (i + 1) % items.length);

  return (
    <>
      {/* Masonry-style grid: 3 cols */}
      <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
        {items.map((item, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={() => setLightboxIdx(idx)}
            className={`relative overflow-hidden bg-muted group ${
              idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
            }`}
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
          </motion.button>
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
                src={items[lightboxIdx].url}
                alt=""
                className="w-full max-h-[80vh] object-contain rounded-xl"
              />
              {items[lightboxIdx].caption && (
                <p className="text-white/70 text-sm text-center mt-3 px-4">{items[lightboxIdx].caption}</p>
              )}
              <div className="absolute top-3 right-3">
                <button onClick={() => setLightboxIdx(null)} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {items.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <p className="text-white/50 text-xs text-center mt-2">{lightboxIdx + 1} / {items.length}</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}