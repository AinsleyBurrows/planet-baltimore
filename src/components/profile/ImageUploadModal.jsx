import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, ZoomIn, ZoomOut, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const MAX_SIZE_MB = 10;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUploadModal({ type, onSave, onClose }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const isBanner = type === 'banner';
  const title = isBanner ? 'Edit Banner' : 'Edit Profile Picture';

  // Auto-open picker on mount (social-platform UX)
  useEffect(() => {
    const t = setTimeout(() => fileInputRef.current?.click(), 80);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleFile = useCallback((f) => {
    setError('');
    if (!ACCEPTED.includes(f.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // Mouse drag
  const handleMouseDown = (e) => {
    if (!preview) return;
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);
  const stopDrag = () => setDragging(false);

  // Touch drag
  const handleTouchStart = (e) => {
    if (!preview) return;
    const t = e.touches[0];
    setDragging(true);
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const handleTouchMove = (e) => {
    if (!dragging || !dragStart) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  // Scroll to zoom
  const handleWheel = (e) => {
    if (!preview) return;
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(1, z - e.deltaY * 0.002)));
  };

  const handleSave = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const field = isBanner ? 'banner_url' : 'avatar_url';
    await base44.auth.updateMe({ [field]: file_url });
    onSave(file_url);
    setUploading(false);
  };

  const previewShape = isBanner
    ? 'aspect-[3/1] rounded-xl'
    : 'aspect-square rounded-full max-w-[240px] mx-auto';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-md bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Cancel
            </button>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!preview || uploading}
              className="rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground h-8 px-4 text-xs font-semibold"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
            </Button>
          </div>

          <div className="p-5 space-y-4">
            {/* Preview / drop zone */}
            <div
              className={`relative overflow-hidden bg-muted border-2 border-dashed border-border select-none ${previewShape} ${preview ? 'cursor-grab active:cursor-grabbing border-solid' : 'cursor-pointer'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrag}
              onMouseLeave={stopDrag}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDrag}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onWheel={handleWheel}
              onClick={!preview ? () => fileInputRef.current?.click() : undefined}
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Preview"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    style={{
                      transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                      transformOrigin: 'center',
                      transition: dragging ? 'none' : 'transform 0.08s',
                    }}
                  />
                  {/* Replace button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/70 text-white text-xs font-medium backdrop-blur-sm transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Change
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-sm font-medium text-foreground">Choose a photo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">or drag & drop · JPEG, PNG, WebP · {MAX_SIZE_MB} MB max</p>
                  </div>
                </div>
              )}
            </div>

            {/* Zoom slider — only when image loaded */}
            {preview && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setZoom(z => Math.max(1, parseFloat((z - 0.1).toFixed(2))))}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.02"
                    value={zoom}
                    onChange={e => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-accent h-1.5 cursor-pointer"
                  />
                  <button
                    onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-center text-xs text-muted-foreground">Drag to reposition · scroll or slide to zoom</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center font-medium">{error}</p>
            )}
          </div>
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
        />
      </motion.div>
    </AnimatePresence>
  );
}