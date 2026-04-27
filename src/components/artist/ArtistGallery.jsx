import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Trash2, Upload, Ruler, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import GalleryUploadModal from './GalleryUploadModal';

// Name of the auto-created gallery series
const GALLERY_SERIES_TITLE = '__gallery__';

export default function ArtistGallery({ portfolioUrls = [], posts = [], isOwner = false, artist = null }) {
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  // Fetch or create the dedicated gallery series
  const { data: gallerySeries } = useQuery({
    queryKey: ['artist-gallery-series', artist?.id],
    queryFn: async () => {
      const results = await base44.entities.ArtistSeries.filter({ artist_id: artist.id, title: GALLERY_SERIES_TITLE });
      if (results.length > 0) return results[0];
      // Create it silently on first use
      return await base44.entities.ArtistSeries.create({
        title: GALLERY_SERIES_TITLE,
        artist_id: artist.id,
        owner_id: artist.owner_id,
        status: 'active',
      });
    },
    enabled: !!artist?.id && isOwner,
  });

  // Fetch ArtistWork items from the gallery series
  const { data: galleryWorks = [] } = useQuery({
    queryKey: ['artist-works', gallerySeries?.id],
    queryFn: () => base44.entities.ArtistWork.filter({ series_id: gallerySeries.id }, 'created_date', 200),
    enabled: !!gallerySeries?.id,
  });

  // Also show portfolio URLs and post media
  const portfolioItems = portfolioUrls.map(url => ({ url, title: null, dimensions: null, type: 'portfolio', id: url }));
  const postMedia = posts.flatMap(p =>
    (p.media_urls || []).map(url => ({ url, title: p.content?.slice(0, 60), dimensions: null, type: 'post', postId: p.id, id: `${p.id}-${url}` }))
  );
  const workItems = galleryWorks.map(w => ({
    url: w.image_urls?.[0] || w.image_url,
    title: w.title !== `Untitled 1` && w.title ? w.title : null,
    dimensions: w.dimensions || null,
    type: 'work',
    workId: w.id,
    id: w.id,
  })).filter(i => !!i.url);

  const allItems = [...workItems, ...portfolioItems, ...postMedia];

  const handleDelete = async (e, idx) => {
    e.stopPropagation();
    if (!window.confirm('Remove this image?')) return;
    const item = allItems[idx];
    if (item.type === 'work') {
      await base44.entities.ArtistWork.delete(item.workId);
      queryClient.invalidateQueries({ queryKey: ['artist-works', gallerySeries?.id] });
    } else if (item.type === 'portfolio' && artist) {
      const newUrls = (artist.portfolio_urls || []).filter(u => u !== item.url);
      await base44.entities.ArtistPage.update(artist.id, { portfolio_urls: newUrls });
      queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    } else if (item.type === 'post') {
      await base44.entities.Post.delete(item.postId);
      queryClient.invalidateQueries({ queryKey: ['artist-posts', artist?.id] });
    }
    if (lightboxIdx === idx) setLightboxIdx(null);
  };

  const prev = () => setLightboxIdx(i => (i - 1 + allItems.length) % allItems.length);
  const next = () => setLightboxIdx(i => (i + 1) % allItems.length);

  return (
    <>
      {/* Upload button for owners */}
      {isOwner && (
        <button
          onClick={() => setShowUpload(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Upload className="w-4 h-4" /> Upload Photos
        </button>
      )}

      {allItems.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground text-sm">
          No gallery works yet.
        </div>
      ) : (
        /* Masonry-style 3-col grid */
        <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
          {allItems.map((item, idx) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15 }}
              className={`relative overflow-hidden bg-muted group cursor-pointer ${
                idx === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
              }`}
              onClick={() => setLightboxIdx(idx)}
            >
              <img
                src={item.url}
                alt={item.title || ''}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-200 flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* Title overlay at bottom */}
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[10px] font-medium truncate">{item.title}</p>
                  {item.dimensions && <p className="text-white/70 text-[9px] truncate">{item.dimensions}</p>}
                </div>
              )}
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
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative max-w-3xl w-full mx-4 flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={allItems[lightboxIdx].url}
                alt=""
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
              {/* Title + dimensions */}
              {(allItems[lightboxIdx].title || allItems[lightboxIdx].dimensions) && (
                <div className="mt-3 text-center space-y-0.5">
                  {allItems[lightboxIdx].title && (
                    <p className="text-white font-semibold text-sm">{allItems[lightboxIdx].title}</p>
                  )}
                  {allItems[lightboxIdx].dimensions && (
                    <p className="text-white/60 text-xs flex items-center justify-center gap-1">
                      <Ruler className="w-3 h-3" />{allItems[lightboxIdx].dimensions}
                    </p>
                  )}
                </div>
              )}
              {!allItems[lightboxIdx].title && allItems[lightboxIdx].title !== null && allItems[lightboxIdx].title !== undefined && (
                <p className="text-white/70 text-sm text-center mt-3 px-4">{allItems[lightboxIdx].title}</p>
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

      {/* Upload modal */}
      {showUpload && gallerySeries && (
        <GalleryUploadModal
          artist={artist}
          gallerySeriesId={gallerySeries.id}
          onClose={() => setShowUpload(false)}
          onSaved={() => setShowUpload(false)}
        />
      )}
    </>
  );
}