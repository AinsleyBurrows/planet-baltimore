import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Trash2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

/**
 * GalleryUploadModal
 * Lets the artist upload multiple photos at once.
 * Each photo gets its own title and size (dimensions) field.
 * They are saved as individual ArtistWork records in a designated gallery series.
 */
export default function GalleryUploadModal({ artist, gallerySeriesId, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [photos, setPhotos] = useState([]); // { file, previewUrl, title, dimensions }
  const [saving, setSaving] = useState(false);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      title: '',
      dimensions: '',
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
    // reset input so same file can be re-added if needed
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePhoto = (idx, field, value) => {
    setPhotos(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (photos.length === 0) return;
    setSaving(true);

    // Upload all images in parallel
    const uploaded = await Promise.all(
      photos.map(p => base44.integrations.Core.UploadFile({ file: p.file }).then(r => r.file_url))
    );

    // Save each photo as an ArtistWork
    await Promise.all(
      photos.map((p, i) =>
        base44.entities.ArtistWork.create({
          title: p.title || `Untitled ${i + 1}`,
          dimensions: p.dimensions || '',
          image_urls: [uploaded[i]],
          image_url: uploaded[i],
          series_id: gallerySeriesId,
          artist_id: artist.id,
          owner_id: artist.owner_id,
          year: new Date().getFullYear().toString(),
        })
      )
    );

    queryClient.invalidateQueries({ queryKey: ['artist-works', gallerySeriesId] });
    queryClient.invalidateQueries({ queryKey: ['artist-gallery-series', artist.id] });
    setSaving(false);
    onSaved();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-xl bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground">Upload Photos to Gallery</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Drop zone / add button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent transition-colors flex flex-col items-center gap-2 text-sm font-medium"
            >
              <ImagePlus className="w-6 h-6" />
              Click to select photos
              <span className="text-xs font-normal text-muted-foreground">You can select multiple at once</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Photo list */}
            {photos.length > 0 && (
              <div className="space-y-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-xl border border-border bg-secondary/30">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Fields */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <input
                        type="text"
                        placeholder="Photo title (e.g. Study No. 3)"
                        value={photo.title}
                        onChange={e => updatePhoto(idx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                      />
                      <input
                        type="text"
                        placeholder="Size (e.g. 24×36 in, 60×90 cm)"
                        value={photo.dimensions}
                        onChange={e => updatePhoto(idx, 'dimensions', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removePhoto(idx)}
                      className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-2">
                Select photos above to get started.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex-shrink-0 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || photos.length === 0}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
                : <><Upload className="w-4 h-4 mr-2" />Upload {photos.length > 0 ? `${photos.length} Photo${photos.length > 1 ? 's' : ''}` : 'Photos'}</>
              }
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}