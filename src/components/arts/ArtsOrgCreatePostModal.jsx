import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function ArtsOrgCreatePostModal({ org, user, onClose }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await base44.entities.Post.create({
      content: content.trim(),
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      author_type: 'event_producer',
      page_id: org.id,
      page_type: 'community',
      visibility: 'public',
    });
    queryClient.invalidateQueries({ queryKey: ['arts-org-posts', org.id] });
    setSaving(false);
    onClose();
  };

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

          <div className="flex-1 overflow-y-auto p-5">
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening at your organization?"
              rows={6}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{content.length} / 1000</p>
          </div>

          <div className="px-5 py-4 border-t border-border flex-shrink-0">
            <Button onClick={handlePost} disabled={saving || !content.trim()} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Posting...</> : <><Send className="w-4 h-4 mr-2" />Publish Post</>}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}