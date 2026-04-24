import React, { useState, useRef } from 'react';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { addHours } from 'date-fns';
import { motion } from 'framer-motion';

export default function AddStoryModal({ user, onClose }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const queryClient = useQueryClient();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handlePost = async () => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const isVideo = file.type.startsWith('video/');
    await base44.entities.EphemeralStory.create({
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      media_url: file_url,
      media_type: isVideo ? 'video' : 'image',
      caption: caption.trim() || undefined,
      expires_at: addHours(new Date(), 24).toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['ephemeral-stories'] });
    setUploading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Add to your story</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {preview ? (
          <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black max-h-64">
            {file?.type.startsWith('video/') ? (
              <video src={preview} className="w-full h-full object-cover" muted />
            ) : (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            )}
            <button
              onClick={() => { setPreview(null); setFile(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current.click()}
            className="w-full aspect-[9/16] max-h-48 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
          >
            <ImagePlus className="w-8 h-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Tap to add photo or video</span>
          </button>
        )}

        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />

        {preview && (
          <input
            type="text"
            placeholder="Add a caption…"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            className="w-full text-sm bg-secondary rounded-lg px-3 py-2 outline-none border border-border focus:border-ring placeholder:text-muted-foreground"
            maxLength={200}
          />
        )}

        <Button
          onClick={handlePost}
          disabled={!file || uploading}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
        >
          {uploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Share Story
        </Button>

        <p className="text-xs text-muted-foreground text-center">Stories disappear after 24 hours</p>
      </motion.div>
    </motion.div>
  );
}