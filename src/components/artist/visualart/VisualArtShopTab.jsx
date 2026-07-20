import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const TYPES = [
  { value: 'original', label: 'Original' },
  { value: 'print', label: 'Print' },
  { value: 'digital_download', label: 'Digital Download' },
  { value: 'other', label: 'Other' },
];
const STATUSES = [
  { value: 'available', label: 'Available', badge: 'bg-green-100 text-green-700' },
  { value: 'sold_out', label: 'Sold', badge: 'bg-red-100 text-red-700' },
  { value: 'on_hold', label: 'On Hold', badge: 'bg-amber-100 text-amber-700' },
  { value: 'preorder', label: 'Preorder', badge: 'bg-blue-100 text-blue-700' },
];
const EMPTY = { title: '', description: '', image_url: '', price: '', item_type: 'original', medium: '', dimensions: '', buy_url: '', status: 'available' };

function WorkForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
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
        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative" onClick={() => imgRef.current?.click()}>
          {form.image_url
            ? <img src={form.image_url} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1"><ShoppingBag className="w-6 h-6 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Image</span></div>}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Work title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm capitalize" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Price" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value === '' ? '' : Number(e.target.value) }))} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Medium (e.g. Oil on canvas)" value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Dimensions (e.g. 24 × 36 in)" value={form.dimensions} onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description / statement (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Buy link URL (optional)" value={form.buy_url} onChange={e => setForm(f => ({ ...f, buy_url: e.target.value }))} />
        <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...form, price: form.price === '' ? null : form.price })} disabled={!form.title || uploading || saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
    </div>
  );
}

const STATUS_BADGE = Object.fromEntries(STATUSES.map(s => [s.value, s.badge]));

function WorkCard({ item, isOwner, onEdit, onDelete }) {
  const status = STATUSES.find(s => s.value === item.status);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="aspect-square bg-secondary">
        {item.image_url
          ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-muted-foreground/40" /></div>}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium capitalize">{item.item_type?.replace('_', ' ')}</span>
          {item.status !== 'available' && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${STATUS_BADGE[item.status] || 'bg-secondary text-muted-foreground'}`}>{status?.label || item.status}</span>}
        </div>
        {(item.medium || item.dimensions) && (
          <p className="text-xs text-muted-foreground mt-2">
            {item.medium && <span className="text-foreground/80">{item.medium}</span>}
            {item.medium && item.dimensions && <span> · </span>}
            {item.dimensions && <span>{item.dimensions}</span>}
          </p>
        )}
        {item.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{item.description}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-foreground text-sm">{item.price ? `$${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : 'Free'}</span>
          {item.buy_url && item.status !== 'sold_out' && <a href={item.buy_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline font-medium">Buy →</a>}
        </div>
      </div>
    </div>
  );
}

export default function VisualArtShopTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['visual-art-works', artistId],
    queryFn: () => base44.entities.ShopItem.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['visual-art-works', artistId] });
  const saveNew = async (form) => { setSaving(true); await base44.entities.ShopItem.create({ ...form, artist_id: artistId }); setSaving(false); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { setSaving(true); await base44.entities.ShopItem.update(editing.id, form); setSaving(false); setEditing(null); refresh(); };
  const del = async (item) => { if (!window.confirm('Remove this work?')) return; await base44.entities.ShopItem.delete(item.id); refresh(); };

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Work</Button>
        </div>
      )}
      {showForm && <WorkForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {items.length === 0 && !showForm
        ? <div className="text-center py-12 text-sm text-muted-foreground">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No works available right now.
          </div>
        : <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{items.map(it => editing?.id === it.id ? <WorkForm key={it.id} initial={it} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving} /> : <WorkCard key={it.id} item={it} isOwner={isOwner} onEdit={() => setEditing(it)} onDelete={() => del(it)} />)}</div>}
    </div>
  );
}