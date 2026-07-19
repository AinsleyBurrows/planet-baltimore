import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Play, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

function VideoForm({ artistId, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', venue: '', date: '', embed_url: '', description: '' });

  const getEmbedUrl = (url) => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return url;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
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

function VideoCard({ video, isOwner, onEdit, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://img.youtube.com/vi/${(video.embed_url.match(/embed\/([^?]+)/) || [])[1] || ''}/hqdefault.jpg`;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="relative aspect-video bg-secondary cursor-pointer" onClick={() => setPlaying(p => !p)}>
        {playing
          ? <iframe src={video.embed_url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={video.title} />
          : <>
            <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center"><Play className="w-5 h-5 text-accent-foreground ml-0.5" /></div>
            </div>
          </>
        }
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{video.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {video.venue && <span className="text-xs text-muted-foreground">{video.venue}</span>}
              {video.date && <span className="text-xs text-muted-foreground">· {format(new Date(video.date), 'MMM yyyy')}</span>}
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        {video.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{video.description}</p>}
      </div>
    </div>
  );
}

export default function ShowreelTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['performance-videos', artistId],
    queryFn: () => base44.entities.PerformanceVideo.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['performance-videos', artistId] });

  const saveNew = async (form) => { await base44.entities.PerformanceVideo.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.PerformanceVideo.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (v) => { if (!window.confirm('Remove this video?')) return; await base44.entities.PerformanceVideo.delete(v.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Video</Button>
        </div>
      )}
      {showForm && <VideoForm artistId={artistId} onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {videos.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No videos added yet.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{videos.map(v => editing?.id === v.id ? <VideoForm key={v.id} artistId={artistId} initial={v} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <VideoCard key={v.id} video={v} isOwner={isOwner} onEdit={() => setEditing(v)} onDelete={() => del(v)} />)}</div>}
    </div>
  );
}