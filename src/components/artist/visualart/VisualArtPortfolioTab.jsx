import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Loader2, Image as ImageIcon, X, Layers, ChevronLeft, ChevronRight, Info } from 'lucide-react';
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

function WorkCard({ item, isOwner, index, onEdit, onDelete, onOpen }) {
  return (
    <div className="group bg-card border border-border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-foreground/20">
      <div className="relative aspect-[4/5] bg-secondary/40 flex items-center justify-center p-5 cursor-pointer" onClick={() => onOpen(item)}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="max-w-full max-h-full object-contain" />
        ) : (
          <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
        )}
        <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-medium select-none">Lot {String(index).padStart(2, '0')}</span>
      </div>
      <div className="px-4 py-3.5 border-t border-border">
        <div className="flex items-start justify-between gap-2">
          <p className="font-serif italic text-base text-foreground leading-snug truncate">{item.title}{item.year ? `, ${item.year}` : ''}</p>
          {isOwner && <div className="flex gap-1 flex-shrink-0 -mt-0.5">
            <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>}
        </div>
        {item.medium && <p className="text-xs text-muted-foreground mt-1.5">{item.medium}</p>}
        {item.dimensions && <p className="text-xs text-muted-foreground">{item.dimensions}</p>}
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
  const [ctrlsVisible, setCtrlsVisible] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const detailIndex = detail ? works.findIndex(w => w.id === detail.id) : -1;
  const goPrev = () => { if (detailIndex > 0) setDetail(works[detailIndex - 1]); };
  const goNext = () => { if (detailIndex >= 0 && detailIndex < works.length - 1) setDetail(works[detailIndex + 1]); };

  useEffect(() => {
    if (!detail) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'i' || e.key === 'I') setShowInfo(v => !v);
      if (e.key === 'Escape') setDetail(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, detailIndex, works]);

  useEffect(() => {
    if (!detail) return;
    let hideTimer;
    const onMove = () => {
      setCtrlsVisible(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setCtrlsVisible(false), 2500);
    };
    onMove();
    window.addEventListener('mousemove', onMove);
    return () => { window.removeEventListener('mousemove', onMove); clearTimeout(hideTimer); };
  }, [detail]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['portfolio-works', artistId] });
  const saveNew = async (form) => { setSaving(true); await base44.entities.PortfolioWork.create({ ...form, artist_id: artistId, owner_id: ownerId }); setSaving(false); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { setSaving(true); await base44.entities.PortfolioWork.update(editing.id, form); setSaving(false); setEditing(null); refresh(); };
  const del = async (it) => { if (!window.confirm('Remove this work?')) return; await base44.entities.PortfolioWork.delete(it.id); refresh(); };

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-8">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-lg" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && <div className="flex justify-end"><Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Work</Button></div>}
      {showForm && <WorkForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {works.length === 0 && !showForm
        ? <div className="text-center py-16"><Layers className="w-10 h-10 mx-auto mb-3 opacity-25" /><p className="font-serif text-base text-muted-foreground">No portfolio works yet.</p></div>
        : <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-8">{works.map((it, i) => editing?.id === it.id ? <WorkForm key={it.id} initial={it} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving} /> : <WorkCard key={it.id} item={it} index={i + 1} isOwner={isOwner} onEdit={() => setEditing(it)} onDelete={() => del(it)} onOpen={setDetail} />)}</div>}

      {detail && (
        <div className="fixed inset-0 z-50 bg-white group viewer flex flex-col sm:flex-row" onClick={() => setDetail(null)}>
          <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 min-h-0">
            {detail.image_url && <img src={detail.image_url} alt={detail.title} className="max-w-full max-h-full object-contain cursor-default" onClick={e => e.stopPropagation()} />}
            {detailIndex > 0 && (
              <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className={`absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/5 text-foreground hover:bg-black/10 backdrop-blur-sm transition-opacity duration-300 ${ctrlsVisible ? 'opacity-100' : 'opacity-0'}`}><ChevronLeft className="w-6 h-6" /></button>
            )}
            {detailIndex >= 0 && detailIndex < works.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); goNext(); }} className={`absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/5 text-foreground hover:bg-black/10 backdrop-blur-sm transition-opacity duration-300 ${ctrlsVisible ? 'opacity-100' : 'opacity-0'}`}><ChevronRight className="w-6 h-6" /></button>
            )}
            {works.length > 1 && !showInfo && (
              <span className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/5 text-foreground text-xs font-medium tracking-wide backdrop-blur-sm transition-opacity duration-300 ${ctrlsVisible ? 'opacity-100' : 'opacity-0'}`}>{detailIndex + 1} / {works.length}</span>
            )}
          </div>
          <aside className={`overflow-y-auto transition-all duration-300 ease-out bg-white border-black/10 ${showInfo ? 'sm:w-80 lg:w-96 max-h-[42vh] sm:max-h-full opacity-100 border-t sm:border-l' : 'sm:w-0 max-h-0 opacity-0 overflow-hidden border-t-0'}`} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-6 sm:px-8 sm:pt-20 sm:pb-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-3">Lot {String(detailIndex + 1).padStart(2, '0')}</p>
              <h3 className="font-serif italic text-2xl text-foreground leading-snug">{detail.title}{detail.year ? `, ${detail.year}` : ''}</h3>
              {detail.medium && <p className="text-sm text-muted-foreground mt-3">{detail.medium}</p>}
              {detail.dimensions && <p className="text-sm text-muted-foreground">{detail.dimensions}</p>}
              {detail.description && <p className="text-sm text-muted-foreground mt-5 leading-relaxed font-serif">{detail.description}</p>}
            </div>
          </aside>
          <button onClick={() => setDetail(null)} className={`absolute top-4 right-4 p-2.5 rounded-full bg-black/5 text-foreground hover:bg-black/10 backdrop-blur-sm transition-opacity duration-300 z-10 ${ctrlsVisible ? 'opacity-100' : 'opacity-0'}`}><X className="w-5 h-5" /></button>
          <button onClick={(e) => { e.stopPropagation(); setShowInfo(v => !v); }} className={`absolute top-14 right-4 p-2.5 rounded-full bg-black/5 text-foreground hover:bg-black/10 backdrop-blur-sm transition-opacity duration-300 z-10 ${ctrlsVisible ? 'opacity-100' : 'opacity-0'}`}><Info className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );
}