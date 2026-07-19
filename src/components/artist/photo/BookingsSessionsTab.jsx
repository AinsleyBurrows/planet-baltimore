import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Camera, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ArtistContactForm from '@/components/artist/ArtistContactForm';

function SessionForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', description: '', price_from: '', duration_label: '', includes: [] });
  const [includeInput, setIncludeInput] = useState('');

  const addInclude = () => {
    if (!includeInput.trim()) return;
    setForm(f => ({ ...f, includes: [...(f.includes || []), includeInput.trim()] }));
    setIncludeInput('');
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Session type * (e.g. Portrait, Headshot)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <input className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="From $" type="number" min="0" step="0.01" value={form.price_from} onChange={e => setForm(f => ({ ...f, price_from: e.target.value === '' ? '' : Number(e.target.value) }))} />
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Duration (e.g. 1 hour, Half day)" value={form.duration_label} onChange={e => setForm(f => ({ ...f, duration_label: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(form.includes || []).map((inc, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary text-xs text-foreground">
              {inc}
              <button onClick={() => setForm(f => ({ ...f, includes: f.includes.filter((_, j) => j !== i) }))}><X className="w-3 h-3 text-muted-foreground" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="What's included (press Enter)" value={includeInput} onChange={e => setIncludeInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInclude(); } }} />
          <Button size="sm" variant="outline" onClick={addInclude}>Add</Button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function SessionCard({ session, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"><Camera className="w-4 h-4" /></div>
          <div>
            <p className="font-semibold text-foreground text-sm">{session.title}</p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
              {session.price_from != null && session.price_from !== '' && <span className="font-medium text-foreground">From ${Number(session.price_from).toFixed(0)}</span>}
              {session.duration_label && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.duration_label}</span>}
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
      {session.description && <p className="text-xs text-muted-foreground mt-2">{session.description}</p>}
      {session.includes?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {session.includes.map((inc, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-accent" />{inc}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BookingsSessionsTab({ artistId, artist, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['photo-sessions', artistId],
    queryFn: () => base44.entities.PhotoSession.filter({ artist_id: artistId }, 'sort_order', 30),
    enabled: !!artistId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['photo-sessions', artistId] });
  const saveNew = async (form) => { await base44.entities.PhotoSession.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.PhotoSession.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (s) => { if (!window.confirm('Remove this session?')) return; await base44.entities.PhotoSession.delete(s.id); refresh(); };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {isLoading
          ? [1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)
          : sessions.map(s => editing?.id === s.id
            ? <SessionForm key={s.id} initial={s} onSave={saveEdit} onCancel={() => setEditing(null)} />
            : <SessionCard key={s.id} session={s} isOwner={isOwner} onEdit={() => setEditing(s)} onDelete={() => del(s)} />)}
        {showForm && <SessionForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
        {isOwner && !showForm && editing === null && (
          <button onClick={() => setShowForm(true)} className="border-2 border-dashed border-border hover:border-accent/50 rounded-xl flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground hover:text-accent transition-colors">
            <Plus className="w-4 h-4" /> Add Session Type
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-foreground mb-1">Book a Session</h2>
        <p className="text-sm text-muted-foreground mb-5">Inquire about availability, rates, or a custom shoot with {artist?.name}.</p>
        <ArtistContactForm artist={artist} />
      </div>
    </div>
  );
}