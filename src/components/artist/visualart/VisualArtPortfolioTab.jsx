import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Loader2, Image as ImageIcon, X, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const EMPTY = { title: '', image_url: '', year: '', medium: '', dimensions: '', description: '', sort_order: 0 };

function WorkForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);
  const upload = async (file) => { setUploading(true); const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm(f => ({ ...f, image_url: file_url })); setUploading(false); };
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative" onClick={() => imgRef.current?.click()}>
          {form.image_url ? <img src={form.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Work title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Medium" value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value }))} />
          </div>
        </div>
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Dimensions (e.g. 24 × 36 in)" value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description / statement (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || uploading || saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && upload(e.target.files[0])} />
    </div>
  );
}

function WorkCard({ item, isOwner, onEdit, onDelete, onOpen }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="bg-secondary cursor-pointer" onClick={() => onOpen(item)}>
        {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-auto block" /> : <div className="w-full aspect-square flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground/40" /></div>}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <p className="font-serif text-base font-medium text-foreground truncate leading-tight">{item.title}</p>
          {isOwner && <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>}
        </div>
        {(item.medium || item.year || item.dimensions) && <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1.5">{[item.year, item.medium, item.dimensions].filter(Boolean).join(' · ')}</p>}
      </div>
    </div>
  );
}

export default function VisualArtPortfolioTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const { data: works = [], isLoading } = useQuery({ queryKey: ['portfolio-works', artistId], queryFn: () => base44.entities.PortfolioWork.filter({ artist_id: artistId }, 'sort_order', 100), enabled: !!artistId });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const detailIndex = detail ? works.findIndex(w => w.id === detail.id) : -1;
  const goPrev = () => { if (detailIndex > 0) setDetail(works[detailIndex - 1]); };
  const goNext = () => { if (detailIndex >= 0 && detailIndex < works.length - 1) setDetail(works[detailIndex + 1]); };

  useEffect(() => {
    if (!detail) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'Escape') setDetail(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, detailIndex, works]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['portfolio-works', artistId] });
  const saveNew = async (form) => { setSaving(true); await base44.entities.PortfolioWork.create({ ...form, artist_id: artistId, owner_id: ownerId }); setSaving(false); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { setSaving(true); await base44.entities.PortfolioWork.update(editing.id, form); setSaving(false); setEditing(null); refresh(); };
  const del = async (it) => { if (!window.confirm('Remove this work?')) return; await base44.entities.PortfolioWork.delete(it.id); refresh(); };

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && <div className="flex justify-end"><Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Work</Button></div>}
      {showForm && <WorkForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {works.length === 0 && !showForm
        ? <div className="text-center py-16"><Layers className="w-10 h-10 mx-auto mb-3 opacity-25" /><p className="font-serif text-base text-muted-foreground">No portfolio works yet.</p></div>
        : <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 items-start">{works.map(it => editing?.id === it.id ? <WorkForm key={it.id} initial={it} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving} /> : <WorkCard key={it.id} item={it} isOwner={isOwner} onEdit={() => setEditing(it)} onDelete={() => del(it)} onOpen={setDetail} />)}</div>}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setDetail(null)}>
          <div className="relative max-w-2xl w-full bg-card rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="relative bg-secondary">
              {detail.image_url && <img src={detail.image_url} alt={detail.title} className="w-full max-h-[60vh] object-contain" />}
              <button onClick={() => setDetail(null)} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 z-10"><X className="w-4 h-4" /></button>
              {detailIndex > 0 && (
                <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 z-10"><ChevronLeft className="w-5 h-5" /></button>
              )}
              {detailIndex >= 0 && detailIndex < works.length - 1 && (
                <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 z-10"><ChevronRight className="w-5 h-5" /></button>
              )}
              {works.length > 1 && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium z-10">{detailIndex + 1} / {works.length}</span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-serif text-xl font-medium text-foreground">{detail.title}</h3>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mt-1.5">{[detail.year, detail.medium, detail.dimensions].filter(Boolean).join(' · ')}</p>
              {detail.description && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{detail.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}