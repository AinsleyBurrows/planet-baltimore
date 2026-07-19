import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMPTY = { title: '', artist: '', year: '', medium: '', image_url: '', note: '' };

function HighlightForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);

  const upload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative" onClick={() => imgRef.current?.click()}>
          {form.image_url ? <img src={form.image_url} alt="" className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-muted-foreground" />}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Work title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Artist" value={form.artist} onChange={e => setForm(f => ({ ...f, artist: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Medium" value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value }))} />
          </div>
        </div>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Note about the work (optional)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.title || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && upload(e.target.files[0])} />
    </div>
  );
}

function HighlightCard({ item, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="aspect-square bg-secondary">
        {item.image_url ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-muted-foreground/30" /></div>}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
            {item.artist && <p className="text-xs text-muted-foreground truncate">{item.artist}</p>}
          </div>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        {(item.year || item.medium) && <p className="text-xs text-muted-foreground mt-1">{[item.year, item.medium].filter(Boolean).join(' · ')}</p>}
        {item.note && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.note}</p>}
      </div>
    </div>
  );
}

export default function CollectionHighlightsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const highlights = org.collection_highlights || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtsOrganization.update(org.id, { collection_highlights: list });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };
  const saveNew = async (form) => { setSaving(true); await save([form, ...highlights]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save(highlights.map((a, i) => i === editIdx ? { ...a, ...form } : a)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this highlight?')) return; await save(highlights.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Highlight</Button>
        </div>
      )}
      {showForm && <HighlightForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {highlights.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No collection highlights yet.</p>
        : <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {highlights.map((item, i) => editIdx === i
            ? <HighlightForm key={i} initial={item} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
            : <HighlightCard key={i} item={item} isOwner={isOwner} onEdit={() => setEditIdx(i)} onDelete={() => remove(i)} />)}
        </div>}
    </div>
  );
}