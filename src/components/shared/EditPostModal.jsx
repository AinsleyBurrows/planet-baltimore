import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

export default function EditPostModal({ post, onClose, onSaved }) {
  const [content, setContent] = useState(post.content || '');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await base44.entities.Post.update(post.id, { content, edited_at: new Date().toISOString() });
    queryClient.invalidateQueries({ queryKey: ['home-posts'] });
    queryClient.invalidateQueries({ queryKey: ['my-posts', post.author_id] });
    setSaving(false);
    onSaved?.({ ...post, content });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Edit Post</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <textarea
          className="w-full px-3 py-2 rounded-xl border border-input bg-transparent text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px]"
          value={content}
          onChange={e => setContent(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="rounded-lg">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}