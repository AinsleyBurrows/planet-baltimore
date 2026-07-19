import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

const EMPTY = { title: '', description: '', start_date: '', end_date: '', image_url: '' };

const fmt = (d) => d ? format(parseISO(d), 'MMM d, yyyy') : '';

function ExhibitionForm({ initial, onSave, onCancel, saving }) {
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
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Exhibition title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            <input type="date" className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
        </div>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.title || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && upload(e.target.files[0])} />
    </div>
  );
}

function ExhibitionCard({ ex, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="aspect-[16/9] bg-secondary">
        {ex.image_url ? <img src={ex.image_url} alt={ex.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-muted-foreground/30" /></div>}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{ex.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fmt(ex.start_date)}{ex.end_date ? ` – ${fmt(ex.end_date)}` : ''}</p>
          </div>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        {ex.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{ex.description}</p>}
      </div>
    </div>
  );
}

export default function ExhibitionsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const exhibitions = org.exhibitions || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtsOrganization.update(org.id, { exhibitions: list });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };
  const saveNew = async (form) => { setSaving(true); await save([form, ...exhibitions]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save(exhibitions.map((a, i) => i === editIdx ? { ...a, ...form } : a)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this exhibition?')) return; await save(exhibitions.filter((_, i) => i !== idx)); };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isOnView = (ex) => { try { const s = ex.start_date ? parseISO(ex.start_date) : null; const e = ex.end_date ? parseISO(ex.end_date) : null; if (s && e) return s <= today && e >= today; if (s && !e) return s <= today; return !!ex.is_current; } catch { return !!ex.is_current; } };
  const isUpcoming = (ex) => { try { return ex.start_date && parseISO(ex.start_date) > today && !isOnView(ex); } catch { return false; } };
  const isPast = (ex) => { try { return ex.end_date && parseISO(ex.end_date) < today; } catch { return false; } };

  const onView = exhibitions.filter(isOnView);
  const upcoming = exhibitions.filter(isUpcoming);
  const past = exhibitions.filter(isPast);
  const uncategorized = exhibitions.filter(ex => !isOnView(ex) && !isUpcoming(ex) && !isPast(ex));

  const Section = ({ label, list }) => list.length === 0 ? null : (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <div className="space-y-3">
        {list.map((ex, i) => {
          const realIdx = exhibitions.indexOf(ex);
          return editIdx === realIdx
            ? <ExhibitionForm key={realIdx} initial={ex} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
            : <ExhibitionCard key={realIdx} ex={ex} isOwner={isOwner} onEdit={() => setEditIdx(realIdx)} onDelete={() => remove(realIdx)} />;
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> New Exhibition</Button>
        </div>
      )}
      {showForm && <ExhibitionForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {exhibitions.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No exhibitions listed yet.</p>
        : <>
          <Section label="On View" list={onView} />
          <Section label="Upcoming" list={upcoming} />
          <Section label="Past" list={past} />
          <Section label="Exhibitions" list={uncategorized} />
        </>}
    </div>
  );
}