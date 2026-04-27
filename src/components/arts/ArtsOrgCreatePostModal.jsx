import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, ImagePlus, VideoIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function ArtsOrgCreatePostModal({ org, user, onClose }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]); // { file, previewUrl, type }
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const addFiles = (files, type) => {
    const newFiles = Array.from(files).map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      type,
    }));
    setMediaFiles(prev => [...prev, ...newFiles].slice(0, 4)); // max 4
  };

  const removeFile = (idx) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePost = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    setSaving(true);

    let media_urls = [];
    let media_type = 'text';

    if (mediaFiles.length > 0) {
      setUploading(true);
      const uploaded = await Promise.all(
        mediaFiles.map(m => base44.integrations.Core.UploadFile({ file: m.file }))
      );
      media_urls = uploaded.map(r => r.file_url);
      media_type = mediaFiles[0].type === 'video' ? 'video' : 'image';
      setUploading(false);
    }

    await base44.entities.Post.create({
      content: content.trim(),
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      author_type: 'event_producer',
      page_id: org.id,
      page_type: 'community',
      visibility: 'public',
      media_urls,
      media_type,
    });

    queryClient.invalidateQueries({ queryKey: ['arts-org-posts', org.id] });
    setSaving(false);
    onClose();
  };

  const busy = saving || uploading;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground">New Post — {org.name}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening at your organization?"
              rows={4}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
            />

            {/* Media previews */}
            {mediaFiles.length > 0 && (
              <div className={`grid gap-2 ${mediaFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {mediaFiles.map((m, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-square bg-secondary">
                    {m.type === 'video' ? (
                      <video src={m.previewUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Media add buttons */}
            {mediaFiles.length < 4 && (
              <div className="flex gap-2">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent text-muted-foreground hover:text-accent text-xs font-medium transition-colors"
                >
                  <ImagePlus className="w-4 h-4" />Photo
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent text-muted-foreground hover:text-accent text-xs font-medium transition-colors"
                >
                  <VideoIcon className="w-4 h-4" />Video
                </button>
                <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files, 'image')} />
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => addFiles(e.target.files, 'video')} />
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border flex-shrink-0">
            <Button
              onClick={handlePost}
              disabled={busy || (!content.trim() && mediaFiles.length === 0)}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {busy ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploading ? 'Uploading...' : 'Posting...'}</> : <><Send className="w-4 h-4 mr-2" />Publish Post</>}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}