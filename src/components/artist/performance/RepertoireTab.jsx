import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Theater, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FORMATS = ['Stage Play', 'Solo Performance', 'Dance Piece', 'Spoken Word', 'Drag Act', 'Comedy Set', 'Physical Theater', 'Interdisciplinary', 'Other'];

function WorkForm({ artistId, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', format: 'Solo Performance', role: 'Performer', synopsis: '', image_url: '', video_url: '', year: '' });
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);

  const uploadImage = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative group" onClick={() => imgRef.current?.click()}>
          {form.image_url
            ? <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1"><Theater className="w-6 h-6 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Image</span></div>}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
              {FORMATS.map(fmt => <option key={fmt} value={fmt}>{fmt}</option>)}
            </select>
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
        </div>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Synopsis / description" value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Video URL (YouTube / Vimeo, optional)" value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
    </div>
  );
}

function WorkCard({ work, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        {work.image_url && <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary"><img src={work.image_url} alt={work.title} className="w-full h-full object-cover" /></div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{work.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {work.format && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{work.format}</span>}
                {work.role && <span className="text-xs text-muted-foreground">{work.role}</span>}
                {work.year && <span className="text-xs text-muted-foreground">· {work.year}</span>}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          {work.synopsis && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{work.synopsis}</p>}
          {work.video_url && <a href={work.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">▶ Watch clip</a>}
        </div>
      </div>
    </div>
  );
}

export default function RepertoireTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: works = [], isLoading } = useQuery({
    queryKey: ['performance-works', artistId],
    queryFn: () => base44.entities.PerformanceWork.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['performance-works', artistId] });

  const saveNew = async (form) => {
    setSaving(true);
    await base44.entities.PerformanceWork.create({ ...form, artist_id: artistId });
    setShowForm(false); setSaving(false); refresh();
  };
  const saveEdit = async (form) => {
    setSaving(true);
    await base44.entities.PerformanceWork.update(editing.id, form);
    setEditing(null); setSaving(false); refresh();
  };
  const del = async (work) => {
    if (!window.confirm('Remove this work?')) return;
    await base44.entities.PerformanceWork.delete(work.id);
    refresh();
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Work</Button>
        </div>
      )}
      {showForm && <WorkForm artistId={artistId} onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {works.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No repertoire added yet.</p>
        : <div className="space-y-3">{works.map(w => editing?.id === w.id ? <WorkForm key={w.id} artistId={artistId} initial={w} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <WorkCard key={w.id} work={w} isOwner={isOwner} onEdit={() => setEditing(w)} onDelete={() => del(w)} />)}</div>}
    </div>
  );
}