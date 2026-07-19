import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

const EMPTY = { title: '', date: '', description: '', audience: '', registration_url: '' };
const fmt = (d) => { try { return d ? format(parseISO(d), 'MMM d, yyyy') : ''; } catch { return ''; } };

function ProgramForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Program title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.date ? form.date.slice(0, 10) : ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Audience (e.g. Families)" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Registration link (optional)" value={form.registration_url} onChange={e => setForm(f => ({ ...f, registration_url: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ProgramCard({ p, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{p.title}</p>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {p.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(p.date)}</span>}
            {p.audience && <span className="px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">{p.audience}</span>}
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
      {p.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{p.description}</p>}
      {p.registration_url && <a href={p.registration_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">Register <ExternalLink className="w-3 h-3" /></a>}
    </div>
  );
}

export default function ProgramsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const programs = org.programs || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtsOrganization.update(org.id, { programs: list });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };
  const saveNew = async (form) => { setSaving(true); await save([form, ...programs]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save(programs.map((a, i) => i === editIdx ? { ...a, ...form } : a)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this program?')) return; await save(programs.filter((_, i) => i !== idx)); };

  const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const sorted = [...programs].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const upcoming = sorted.filter(p => !p.date || (p.date && new Date(p.date) >= today));
  const past = sorted.filter(p => p.date && new Date(p.date) < today);

  const List = ({ list }) => (
    <div className="space-y-3">
      {list.map((p) => {
        const i = programs.indexOf(p);
        return editIdx === i
          ? <ProgramForm key={i} initial={p} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
          : <ProgramCard key={i} p={p} isOwner={isOwner} onEdit={() => setEditIdx(i)} onDelete={() => remove(i)} />;
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Program</Button>
        </div>
      )}
      {showForm && <ProgramForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {programs.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No programs listed yet.</p>
        : <>
          {upcoming.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Upcoming</p><List list={upcoming} /></div>}
          {past.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Past</p><List list={past} /></div>}
        </>}
    </div>
  );
}