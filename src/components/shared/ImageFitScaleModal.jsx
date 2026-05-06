import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ImageFitScaleModal
 * Lets the user pick a new image file (or reuse the existing one),
 * choose how it fits the photo box (cover / contain / fill),
 * and drag to pan + slider to scale.
 *
 * Props:
 *   imageUrl       – current image URL (shown as starting point)
 *   aspectRatio    – CSS aspect-ratio string e.g. "1/1" | "16/9"  (default "1/1")
 *   onSave(file, settings) – called with the File (or null if unchanged) + { objectFit, scale, offsetX, offsetY }
 *   onClose()
 *   isLoading      – show saving spinner
 */
export default function ImageFitScaleModal({ imageUrl, aspectRatio = '1/1', onSave, onClose, isLoading }) {
  const [file, setFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(imageUrl || '');
  const [objectFit, setObjectFit] = useState('cover');
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 50, y: 50 }); // percent
  const [dragging, setDragging] = useState(false);
  const startDrag = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const FIT_OPTIONS = [
    { value: 'cover', label: 'Fill (crop to fit)' },
    { value: 'contain', label: 'Fit (show all)' },
    { value: 'fill', label: 'Stretch' },
  ];

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreviewSrc(URL.createObjectURL(f));
    setScale(1);
    setOffset({ x: 50, y: 50 });
  };

  // ── Drag to pan ──────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (objectFit !== 'cover') return;
    setDragging(true);
    startDrag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = (e) => {
    if (!dragging || !startDrag.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((e.clientX - startDrag.current.x) / rect.width) * -10;
    const dy = ((e.clientY - startDrag.current.y) / rect.height) * -10;
    setOffset({
      x: Math.max(0, Math.min(100, startDrag.current.ox + dx)),
      y: Math.max(0, Math.min(100, startDrag.current.oy + dy)),
    });
  };

  const handleMouseUp = () => setDragging(false);

  // Touch equivalents
  const handleTouchStart = (e) => {
    if (objectFit !== 'cover') return;
    const t = e.touches[0];
    setDragging(true);
    startDrag.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
  };

  const handleTouchMove = (e) => {
    if (!dragging || !startDrag.current) return;
    const t = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((t.clientX - startDrag.current.x) / rect.width) * -10;
    const dy = ((t.clientY - startDrag.current.y) / rect.height) * -10;
    setOffset({
      x: Math.max(0, Math.min(100, startDrag.current.ox + dx)),
      y: Math.max(0, Math.min(100, startDrag.current.oy + dy)),
    });
  };

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragging]);

  const handleSave = () => {
    onSave(file, { objectFit, scale, offsetX: offset.x, offsetY: offset.y });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
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
            <h2 className="text-sm font-semibold text-foreground">Adjust Photo</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Preview box */}
            <div
              ref={containerRef}
              className="relative w-full overflow-hidden rounded-xl bg-secondary select-none border border-border"
              style={{ aspectRatio }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => setDragging(false)}
              style={{ aspectRatio, cursor: objectFit === 'cover' ? (dragging ? 'grabbing' : 'grab') : 'default' }}
            >
              {previewSrc ? (
                <img
                  src={previewSrc}
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit,
                    objectPosition: objectFit === 'cover' ? `${offset.x}% ${offset.y}%` : 'center',
                    transform: `scale(${scale})`,
                    transformOrigin: `${offset.x}% ${offset.y}%`,
                    transition: dragging ? 'none' : 'transform 0.15s ease',
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No image selected
                </div>
              )}
              {objectFit === 'cover' && previewSrc && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full pointer-events-none">
                  Drag to reposition
                </div>
              )}
            </div>

            {/* Fit options */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fit Style</label>
              <div className="grid grid-cols-3 gap-2">
                {FIT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setObjectFit(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${objectFit === opt.value ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-muted-foreground'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Scale</label>
                <span className="text-xs text-muted-foreground">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.05}
                  value={scale}
                  onChange={e => setScale(parseFloat(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </div>

            {/* Change image button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors"
            >
              {previewSrc ? 'Change Image' : 'Choose Image'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Footer */}
          <div className="px-5 pb-5">
            <Button
              onClick={handleSave}
              disabled={isLoading || !previewSrc}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                : <><Check className="w-4 h-4" />Apply Changes</>}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}