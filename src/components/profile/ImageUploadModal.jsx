import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, ZoomIn, ZoomOut, Check, Loader2 } from 'lucide-react';
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
  const previewRef = useRef(null);

  const isBanner = type === 'banner';
  const title = isBanner ? 'Update Banner Image' : 'Update Profile Picture';
  const aspectClass = isBanner ? 'aspect-[3/1]' : 'aspect-square';
  const containerClass = isBanner ? 'rounded-xl' : 'rounded-full';

  const handleFile = useCallback((f) => {
    setError('');
    if (!ACCEPTED.includes(f.type)) {
      setError('Please upload a JPEG, PNG, WebP, or GIF image.');
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SIZE_MB}MB.`);
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

  const handleMouseDown = (e) => {
    if (!preview) return;
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !dragStart) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const handleMouseUp = () => setDragging(false);

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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Preview area */}
            <div
              className={`relative overflow-hidden bg-muted cursor-grab active:cursor-grabbing select-none ${aspectClass} ${containerClass} border-2 border-dashed border-border`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              ref={previewRef}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  style={{
                    transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                    transformOrigin: 'center',
                    transition: dragging ? 'none' : 'transform 0.1s',
                  }}
                />
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-accent transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG, WebP · Max {MAX_SIZE_MB}MB</p>
                  </div>
                </button>
              )}

              {/* Change image overlay when preview exists */}
              {preview && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Zoom controls */}
            {preview && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom(z => Math.max(1, z - 0.1))}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <ZoomOut className="w-4 h-4 text-foreground" />
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                  className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <ZoomIn className="w-4 h-4 text-foreground" />
                </button>
                <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(zoom * 100)}%</span>
              </div>
            )}

            {preview && (
              <p className="text-xs text-muted-foreground text-center -mt-1">Drag to reposition · Scroll to zoom</p>
            )}

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!preview || uploading}
                className="flex-1 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                ) : (
                  <><Check className="w-4 h-4" />Save</>
                )}
              </Button>
            </div>
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