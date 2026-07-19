import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, X, Loader2, Images, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function CollectionForm({ artistId, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', year: '', cover_url: '', description: '', images: [] });
  const [uploading, setUploading] = useState(false);
  const coverRef = useRef(null);
  const imgsRef = useRef(null);

  const uploadOne = async (file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    return file_url;
  };

  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const urls = await Promise.all(files.map(uploadOne));
    setForm(f => ({ ...f, images: [...(f.images || []), ...urls] }));
    setUploading(false);
  };

  const handleCover = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);
    const url = await uploadOne(f);
    setForm(p => ({ ...p, cover_url: url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative" onClick={() => coverRef.current?.click()}>
          {form.cover_url
            ? <img src={form.cover_url} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1"><Images className="w-6 h-6 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Cover</span></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Collection title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
        </div>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      {form.images?.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {form.images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 cursor-pointer text-xs text-muted-foreground hover:text-accent transition-colors">
          <Plus className="w-3.5 h-3.5" />Add Photos
          <input ref={imgsRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
        </label>
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</> : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
    </div>
  );
}

function CollectionCard({ collection, isOwner, onEdit, onDelete, onImageClick }) {
  const [open, setOpen] = useState(false);
  const imgs = collection.images || [];
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary cursor-pointer" onClick={() => collection.cover_url && onImageClick(collection.cover_url, imgs)}>
          {collection.cover_url ? <img src={collection.cover_url} alt={collection.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Images className="w-6 h-6 text-muted-foreground/40" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div>
              <p className="font-semibold text-foreground text-sm truncate">{collection.title}</p>
              {collection.year && <p className="text-xs text-muted-foreground">{collection.year}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => setOpen(v => !v)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />{imgs.length}
              </button>
              {isOwner && <>
                <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </>}
            </div>
          </div>
          {collection.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{collection.description}</p>}
        </div>
      </div>
      {open && imgs.length > 0 && (
        <div className="grid grid-cols-3 gap-0.5 px-3 pb-3">
          {imgs.map((url, i) => (
            <div key={i} className="aspect-square rounded-md overflow-hidden bg-muted cursor-pointer" onClick={() => onImageClick(url, imgs)}>
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PortfolioCollectionsTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['photo-collections', artistId],
    queryFn: () => base44.entities.PhotoCollection.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['photo-collections', artistId] });
  const saveNew = async (form) => { await base44.entities.PhotoCollection.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.PhotoCollection.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (c) => { if (!window.confirm('Delete this collection?')) return; await base44.entities.PhotoCollection.delete(c.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> New Collection</Button>
        </div>
      )}
      {showForm && <CollectionForm artistId={artistId} onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {collections.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No collections yet.</p>
        : collections.map(c => editing?.id === c.id
          ? <CollectionForm key={c.id} artistId={artistId} initial={c} onSave={saveEdit} onCancel={() => setEditing(null)} />
          : <CollectionCard key={c.id} collection={c} isOwner={isOwner} onEdit={() => setEditing(c)} onDelete={() => del(c)} onImageClick={(url) => setLightbox(url)} />)}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"><X className="w-5 h-5" /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}