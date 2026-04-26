import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Flame, Megaphone, Lightbulb, Star, Pencil as PencilIcon, Trash2, X, Loader2, Image as ImageIcon, Clock, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import CommentSection from '@/components/shared/CommentSection';

const UPDATE_TYPES = [
  { id: 'wip', label: 'Work In Progress', icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'bg-blue-500/10 text-blue-600' },
  { id: 'process', label: 'Process', icon: PencilIcon, color: 'bg-purple-500/10 text-purple-600' },
  { id: 'reflection', label: 'Reflection', icon: Lightbulb, color: 'bg-green-500/10 text-green-600' },
  { id: 'milestone', label: 'Milestone', icon: Star, color: 'bg-accent/10 text-accent' },
];

function UpdateForm({ artistId, ownerId, update, onClose, onSaved }) {
  const [form, setForm] = useState({
    content: update?.content || '',
    title: update?.title || '',
    update_type: update?.update_type || 'wip',
    visibility: update?.visibility || 'public',
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState(update?.media_urls || []);
  const [saving, setSaving] = useState(false);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleSave = async () => {
    setSaving(true);
    let mediaUrls = update?.media_urls?.filter(u => imagePreviews.includes(u)) || [];
    for (const file of imageFiles) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      mediaUrls.push(file_url);
    }
    const data = { ...form, media_urls: mediaUrls, artist_id: artistId, owner_id: ownerId };
    if (update?.id) {
      await base44.entities.StudioUpdate.update(update.id, data);
    } else {
      await base44.entities.StudioUpdate.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{update ? 'Edit Update' : 'New Studio Update'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        {/* Type selector */}
        <div className="flex flex-wrap gap-2">
          {UPDATE_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, update_type: t.id }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.update_type === t.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-border/80'}`}>
                <Icon className="w-3 h-3" />{t.label}
              </button>
            );
          })}
        </div>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Title (optional)" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px]" placeholder="Share what you're working on, a reflection, or any studio update…" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />

        {/* Image previews */}
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button onClick={() => { setImagePreviews(p => p.filter((_, j) => j !== i)); setImageFiles(p => p.filter((_, j) => j !== i)); }}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 cursor-pointer text-xs text-muted-foreground hover:text-accent transition-colors">
            <ImageIcon className="w-3.5 h-3.5" />Add Photos
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
          </label>
          <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.visibility} onChange={e => setForm(p => ({ ...p, visibility: e.target.value }))}>
            <option value="public">🌐 Public</option>
            <option value="followers">👥 Followers only</option>
          </select>
        </div>

        <Button onClick={handleSave} disabled={!form.content.trim() || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : (update ? 'Save Changes' : 'Post Update')}
        </Button>
      </motion.div>
    </div>
  );
}

function UpdateCard({ update, isOwner, onDelete, onEdit }) {
  const [showComments, setShowComments] = useState(false);
  const typeInfo = UPDATE_TYPES.find(t => t.id === update.update_type) || UPDATE_TYPES[0];
  const Icon = typeInfo.icon;

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Badge className={`${typeInfo.color} border-0 text-xs flex items-center gap-1`}>
              <Icon className="w-3 h-3" />{typeInfo.label}
            </Badge>
            {update.visibility === 'followers' && <Badge variant="outline" className="text-xs">Followers only</Badge>}
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <button onClick={() => onEdit(update)} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><PencilIcon className="w-3.5 h-3.5" /></button>
              <button onClick={() => { if (window.confirm('Delete this update?')) onDelete(update.id); }} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>

        {update.title && <h3 className="font-semibold text-foreground mb-1">{update.title}</h3>}
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{update.content}</p>
        <p className="text-xs text-muted-foreground mt-2">{update.created_date ? formatDistanceToNow(new Date(update.created_date), { addSuffix: true }) : ''}</p>
      </div>

      {update.media_urls?.length > 0 && (
        <div className={`grid gap-0.5 ${update.media_urls.length === 1 ? '' : 'grid-cols-2'}`}>
          {update.media_urls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="w-full aspect-square object-cover" loading="lazy" />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 px-4 py-3 border-t border-border">
        <button onClick={() => setShowComments(v => !v)} className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
          <MessageCircle className="w-4 h-4" />{update.comments_count || 0}
        </button>
      </div>

      {showComments && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          <CommentSection targetType="studio_update" targetId={update.id} />
        </div>
      )}
    </article>
  );
}

export default function ArtistStudioJournal({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);

  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['studio-updates', artistId],
    queryFn: () => base44.entities.StudioUpdate.filter({ artist_id: artistId }, '-created_date', 50),
    enabled: !!artistId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StudioUpdate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio-updates', artistId] }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['studio-updates', artistId] });
    setShowForm(false);
    setEditingUpdate(null);
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <button onClick={() => { setEditingUpdate(null); setShowForm(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 text-sm text-muted-foreground hover:text-accent transition-colors">
          <Plus className="w-4 h-4" /> Share a studio update
        </button>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : updates.length === 0 ? (
        <div className="text-center py-16">
          <Flame className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No studio updates yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Share your process, works in progress, and milestones.</p>}
        </div>
      ) : (
        updates.map(u => (
          <UpdateCard key={u.id} update={u} isOwner={isOwner}
            onDelete={(id) => deleteMutation.mutate(id)}
            onEdit={(update) => { setEditingUpdate(update); setShowForm(true); }}
          />
        ))
      )}

      <AnimatePresence>
        {showForm && <UpdateForm artistId={artistId} ownerId={ownerId} update={editingUpdate}
          onClose={() => { setShowForm(false); setEditingUpdate(null); }} onSaved={refresh} />}
      </AnimatePresence>
    </div>
  );
}