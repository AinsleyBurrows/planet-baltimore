import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostCard from '@/components/shared/PostCard';
import { motion, AnimatePresence } from 'framer-motion';

export default function GovNewsTab({ agency, isOwner, user }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: posts = [] } = useQuery({
    queryKey: ['gov-posts', agency.id],
    queryFn: () => base44.entities.Post.filter({ page_id: agency.id, page_type: 'government' }, '-created_date', 30),
    enabled: !!agency.id,
  });

  const createPost = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await base44.entities.Post.create({
      author_id: user.id,
      author_name: user.full_name || 'Government Agency',
      author_avatar: user.avatar_url || agency.image_url || '',
      author_type: 'government',
      page_id: agency.id,
      page_type: 'government',
      content,
      post_type: 'announcement',
      media_type: 'text',
    });
    setSaving(false);
    setContent('');
    setShowCreate(false);
    queryClient.invalidateQueries({ queryKey: ['gov-posts', agency.id] });
  };

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this announcement?')) return;
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ['gov-posts', agency.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No announcements yet.</div>
      ) : (
        posts.map(p => (
          <div key={p.id} className="relative">
            <PostCard post={p} currentUserId={user?.id} />
            {isOwner && (
              <div className="flex gap-2 mt-1 ml-1">
                <button onClick={() => deletePost(p.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        ))
      )}

      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">New Announcement</h3>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
              </div>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px]"
                placeholder="Write a public notice, press release, or service alert…"
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <Button onClick={createPost} disabled={!content.trim() || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : 'Post Announcement'}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}