import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const ITEM_TYPES = ['print', 'original', 'digital_download', 'merch', 'book', 'other'];
const STATUSES = ['available', 'sold_out', 'preorder'];

function ItemForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', description: '', image_url: '', price: '', item_type: 'merch', buy_url: '', status: 'available' });
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
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative" onClick={() => imgRef.current?.click()}>
          {form.image_url ? <img src={form.image_url} alt="" className="w-full h-full object-cover" /> : <ShoppingBag className="w-6 h-6 text-muted-foreground" />}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Item title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}>
              {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <input className="w-24 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Price" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value === '' ? '' : Number(e.target.value) }))} />
          </div>
        </div>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Buy link URL (optional)" value={form.buy_url} onChange={e => setForm(f => ({ ...f, buy_url: e.target.value }))} />
        <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
    </div>
  );
}

function ItemCard({ item, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="aspect-square bg-secondary">
        {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-muted-foreground/40" /></div>}
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
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{item.item_type?.replace('_', ' ')}</span>
          {item.status !== 'available' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">{item.status.replace('_', ' ')}</span>}
        </div>
        {item.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.description}</p>}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-foreground text-sm">{item.price ? `$${Number(item.price).toFixed(2)}` : 'Free'}</span>
          {item.buy_url && <a href={item.buy_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline font-medium">Buy →</a>}
        </div>
      </div>
    </div>
  );
}

export default function MuseumShopTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['org-shop-items', org.id],
    queryFn: () => base44.entities.ShopItem.filter({ org_id: org.id }, 'sort_order', 50),
    enabled: !!org.id,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['org-shop-items', org.id] });
  const saveNew = async (form) => { await base44.entities.ShopItem.create({ ...form, org_id: org.id }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.ShopItem.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (item) => { if (!window.confirm('Remove this item?')) return; await base44.entities.ShopItem.delete(item.id); refresh(); };

  if (isLoading) return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{[1, 2, 3].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Item</Button>
        </div>
      )}
      {showForm && <ItemForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {items.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No items in the shop yet.</p>
        : <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{items.map(it => editing?.id === it.id ? <ItemForm key={it.id} initial={it} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ItemCard key={it.id} item={it} isOwner={isOwner} onEdit={() => setEditing(it)} onDelete={() => del(it)} />)}</div>}
    </div>
  );
}