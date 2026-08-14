import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Loader2, X, Mail, Phone, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ROLES = [
  { value: 'head', label: 'Department Head' },
  { value: 'deputy', label: 'Deputy Director' },
  { value: 'director', label: 'Director' },
  { value: 'staff', label: 'Staff' },
  { value: 'other', label: 'Other' },
];
const ROLE_ORDER = { head: 0, deputy: 1, director: 2, staff: 3, other: 4 };
const EMPTY = { name: '', title: '', bio: '', image_url: '', email: '', phone: '', role: 'head', sort_order: 0 };

export default function GovLeadershipTab({ agency, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);

  const leadership = (agency.leadership || []).slice().sort((a, b) => (ROLE_ORDER[a.role] ?? 4) - (ROLE_ORDER[b.role] ?? 4) || (a.sort_order || 0) - (b.sort_order || 0));

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (idx) => { setForm(leadership[idx]); setEditing(idx); setShowForm(true); };

  const uploadImage = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const original = agency.leadership || [];
    const next = [...original];
    if (editing !== null) {
      const origIdx = original.findIndex(m => m === leadership[editing]);
      if (origIdx >= 0) next[origIdx] = form;
    } else {
      next.push(form);
    }
    await base44.entities.GovernmentAgency.update(agency.id, { leadership: next });
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  const remove = async (idx) => {
    if (!window.confirm('Remove this person?')) return;
    const origIdx = (agency.leadership || []).findIndex(m => m === leadership[idx]);
    if (origIdx < 0) return;
    const next = (agency.leadership || []).filter((_, i) => i !== origIdx);
    await base44.entities.GovernmentAgency.update(agency.id, { leadership: next });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openNew} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Member</Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">{editing !== null ? 'Edit Member' : 'Add Leadership Member'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-3">
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center" onClick={() => imgRef.current?.click()}>
              {form.image_url ? <img src={form.image_url} alt="" className="w-full h-full object-cover" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 space-y-2">
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Full name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title (e.g. Director of Public Works)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Sort order" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Bio (optional)" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={!form.name.trim() || saving || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
        </div>
      )}

      {leadership.length === 0 && !showForm ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No leadership listed yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {leadership.map((m, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-4 flex gap-3">
              <Avatar className="w-14 h-14 rounded-lg flex-shrink-0">
                <AvatarImage src={m.image_url} className="object-cover rounded-lg" />
                <AvatarFallback className="bg-accent/10 text-accent text-lg font-bold rounded-lg">{m.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{m.name}</p>
                    <p className="text-xs text-accent">{m.title}</p>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(idx)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(idx)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                {m.bio && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{m.bio}</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {m.email && <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-xs text-accent hover:underline"><Mail className="w-3 h-3" /> {m.email}</a>}
                  {m.phone && <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-xs text-accent hover:underline"><Phone className="w-3 h-3" /> {m.phone}</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}