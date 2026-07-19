import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Upload, Loader2, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function ExclusiveForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', description: '', video_url: '', duration_label: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const uploadVideo = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, video_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Duration label (e.g. 4:32)" value={form.duration_label} onChange={e => setForm(f => ({ ...f, duration_label: e.target.value }))} />
      <div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors disabled:opacity-50">
          <Upload className="w-3.5 h-3.5" />{uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</> : form.video_url ? 'Replace Video' : 'Upload Video'}
        </button>
        {form.video_url && <p className="text-xs text-accent mt-1 truncate">📎 {form.video_url.split('/').pop()}</p>}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || !form.video_url} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => e.target.files[0] && uploadVideo(e.target.files[0])} />
    </div>
  );
}

function ExclusiveCard({ video, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <video src={video.video_url} controls poster={video.thumbnail_url} className="w-full aspect-video bg-secondary" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{video.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium flex items-center gap-1"><Film className="w-2.5 h-2.5" />Exclusive</span>
              {video.duration_label && <span className="text-xs text-muted-foreground">{video.duration_label}</span>}
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

export default function WatchTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['exclusive-videos', artistId],
    queryFn: () => base44.entities.ExclusiveVideo.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['exclusive-videos', artistId] });
  const saveNew = async (form) => { await base44.entities.ExclusiveVideo.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.ExclusiveVideo.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (v) => { if (!window.confirm('Remove this video?')) return; await base44.entities.ExclusiveVideo.delete(v.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Upload Video</Button>
        </div>
      )}
      {showForm && <ExclusiveForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {videos.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No exclusive videos uploaded yet.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{videos.map(v => editing?.id === v.id ? <ExclusiveForm key={v.id} initial={v} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ExclusiveCard key={v.id} video={v} isOwner={isOwner} onEdit={() => setEditing(v)} onDelete={() => del(v)} />)}</div>}
    </div>
  );
}