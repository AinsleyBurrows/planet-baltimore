import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const getEmbedUrl = (url) => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
};

function ClipForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', venue: '', date: '', embed_url: '', description: '' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Clip title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue / festival" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
        <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="YouTube / Vimeo URL *" value={form.embed_url} onChange={e => setForm(f => ({ ...f, embed_url: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...form, embed_url: getEmbedUrl(form.embed_url) })} disabled={!form.title || !form.embed_url} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ClipCard({ clip, isOwner, onEdit, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const ytId = (clip.embed_url.match(/embed\/([^?]+)/) || [])[1] || '';
  const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : clip.thumbnail_url;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-secondary cursor-pointer" onClick={() => setPlaying(p => !p)}>
        {playing
          ? <iframe src={clip.embed_url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={clip.title} />
          : <>
            {thumb ? <img src={thumb} alt={clip.title} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center"><Play className="w-5 h-5 text-accent-foreground ml-0.5" /></div>
            </div>
          </>
        }
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{clip.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {clip.venue && <span className="text-xs text-muted-foreground">{clip.venue}</span>}
              {clip.date && <span className="text-xs text-muted-foreground">· {format(new Date(clip.date), 'MMM yyyy')}</span>}
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        {clip.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{clip.description}</p>}
      </div>
    </div>
  );
}

export default function ReelTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: clips = [], isLoading } = useQuery({
    queryKey: ['video-reel', artistId],
    queryFn: () => base44.entities.VideoReel.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['video-reel', artistId] });
  const saveNew = async (form) => { await base44.entities.VideoReel.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.VideoReel.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (c) => { if (!window.confirm('Remove this clip?')) return; await base44.entities.VideoReel.delete(c.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Clip</Button>
        </div>
      )}
      {showForm && <ClipForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {clips.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No clips added yet.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{clips.map(c => editing?.id === c.id ? <ClipForm key={c.id} initial={c} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ClipCard key={c.id} clip={c} isOwner={isOwner} onEdit={() => setEditing(c)} onDelete={() => del(c)} />)}</div>}
    </div>
  );
}