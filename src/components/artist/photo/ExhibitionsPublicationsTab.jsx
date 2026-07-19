import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, ExternalLink, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const TYPES = [
  { id: 'solo_exhibition', label: 'Solo Exhibition' },
  { id: 'group_exhibition', label: 'Group Exhibition' },
  { id: 'publication', label: 'Publication' },
  { id: 'award', label: 'Award' },
  { id: 'press', label: 'Press' },
  { id: 'feature', label: 'Feature' },
];

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

function RecognitionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', type: 'solo_exhibition', venue: '', city: '', date: '', description: '', link: '' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Date" type="date" value={form.date ? form.date.slice(0, 10) : ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue / Outlet" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link (optional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function RecognitionCard({ rec, isOwner, onEdit, onDelete }) {
  const typeLabel = TYPES.find(t => t.id === rec.type)?.label || rec.type;
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"><Trophy className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground text-sm">{rec.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{typeLabel}{rec.venue ? ` · ${rec.venue}` : ''}{rec.city ? `, ${rec.city}` : ''}</p>
          </div>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        {rec.date && <p className="text-xs text-muted-foreground mt-1">{formatDate(rec.date)}</p>}
        {rec.description && <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>}
        {rec.link && <a href={rec.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1.5">View <ExternalLink className="w-3 h-3" /></a>}
      </div>
    </div>
  );
}

export default function ExhibitionsPublicationsTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: recs = [], isLoading } = useQuery({
    queryKey: ['photo-recognition', artistId],
    queryFn: () => base44.entities.PhotoRecognition.filter({ artist_id: artistId }, '-date', 50),
    enabled: !!artistId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['photo-recognition', artistId] });
  const saveNew = async (form) => { await base44.entities.PhotoRecognition.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.PhotoRecognition.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (r) => { if (!window.confirm('Remove this entry?')) return; await base44.entities.PhotoRecognition.delete(r.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-3">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Entry</Button>
        </div>
      )}
      {showForm && <RecognitionForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {recs.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No exhibitions or publications listed yet.</p>
        : recs.map(r => editing?.id === r.id
          ? <RecognitionForm key={r.id} initial={r} onSave={saveEdit} onCancel={() => setEditing(null)} />
          : <RecognitionCard key={r.id} rec={r} isOwner={isOwner} onEdit={() => setEditing(r)} onDelete={() => del(r)} />)}
    </div>
  );
}