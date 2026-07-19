import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const TYPES = [
  { value: 'screening', label: 'Screening' },
  { value: 'premiere', label: 'Premiere' },
  { value: 'festival_selection', label: 'Festival Selection' },
  { value: 'awards_screening', label: 'Awards Screening' },
  { value: 'q_and_a', label: 'Q & A' },
  { value: 'other', label: 'Other' },
];

function ScreeningForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', festival: '', venue: '', city: '', date: '', ticket_url: '', type: 'screening' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Film / project title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Festival / series (e.g. Maryland Film Festival)" value={form.festival} onChange={e => setForm(f => ({ ...f, festival: e.target.value }))} />
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <input type="datetime-local" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Ticket / RSVP link (optional)" value={form.ticket_url} onChange={e => setForm(f => ({ ...f, ticket_url: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || !form.date} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ScreeningCard({ item, isOwner, onEdit, onDelete }) {
  const isPast = item.date && new Date(item.date) < new Date();
  const typeLabel = (TYPES.find(t => t.value === item.type)?.label || item.type || '').replace(/_/g, ' ');
  return (
    <div className={`bg-card border rounded-xl p-4 flex items-center gap-3 ${isPast ? 'border-border/60 opacity-75' : 'border-border'}`}>
      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-secondary flex flex-col items-center justify-center">
        {item.date ? <>
          <span className="text-[10px] uppercase text-muted-foreground font-semibold">{format(new Date(item.date), 'MMM')}</span>
          <span className="text-lg font-bold text-foreground leading-none">{format(new Date(item.date), 'd')}</span>
        </> : <Calendar className="w-5 h-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.festival && <span className="text-xs text-muted-foreground">{item.festival}</span>}
          {item.venue && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{item.venue}</span>}
          {item.city && <span className="text-xs text-muted-foreground">{item.city}</span>}
          {typeLabel && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium capitalize">{typeLabel}</span>}
        </div>
        {item.date && <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(item.date), 'EEE MMM d, yyyy · h:mm a')} {isPast && '· Past'}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {item.ticket_url && <a href={item.ticket_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md hover:bg-secondary text-accent"><ExternalLink className="w-3.5 h-3.5" /></a>}
        {isOwner && <>
          <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
        </>}
      </div>
    </div>
  );
}

export default function ScreeningsTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: screenings = [], isLoading } = useQuery({
    queryKey: ['video-screenings', artistId],
    queryFn: () => base44.entities.Screening.filter({ artist_id: artistId }, '-date', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['video-screenings', artistId] });
  const saveNew = async (form) => { await base44.entities.Screening.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.Screening.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (s) => { if (!window.confirm('Remove this screening?')) return; await base44.entities.Screening.delete(s.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  const upcoming = screenings.filter(s => !s.date || new Date(s.date) >= new Date());
  const past = screenings.filter(s => s.date && new Date(s.date) < new Date()).reverse();

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Screening</Button>
        </div>
      )}
      {showForm && <ScreeningForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {screenings.length === 0 && !showForm && <p className="text-center py-12 text-sm text-muted-foreground">No screenings listed yet.</p>}
      {upcoming.length > 0 && <div><p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">Upcoming</p><div className="space-y-2">{upcoming.map(s => editing?.id === s.id ? <ScreeningForm key={s.id} initial={s} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ScreeningCard key={s.id} item={s} isOwner={isOwner} onEdit={() => setEditing(s)} onDelete={() => del(s)} />)}</div></div>}
      {past.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Past</p><div className="space-y-2">{past.map(s => editing?.id === s.id ? <ScreeningForm key={s.id} initial={s} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ScreeningCard key={s.id} item={s} isOwner={isOwner} onEdit={() => setEditing(s)} onDelete={() => del(s)} />)}</div></div>}
    </div>
  );
}