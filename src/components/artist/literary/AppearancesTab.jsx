import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Calendar, MapPin, Ticket, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const TYPES = ['reading', 'signing', 'festival', 'panel', 'workshop', 'tour', 'other'];

function AppearanceForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', venue: '', city: '', date: '', time_label: '', type: 'reading', ticket_url: '' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title (e.g. 'Reading at Ivy Bookshop') *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" type="datetime-local" value={form.date ? form.date.slice(0, 16) : ''} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <select className="w-32 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Time label (e.g. '7:00 PM')" value={form.time_label} onChange={e => setForm(f => ({ ...f, time_label: e.target.value }))} />
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Ticket / RSVP URL" value={form.ticket_url} onChange={e => setForm(f => ({ ...f, ticket_url: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || !form.date} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function AppearanceCard({ ap, isOwner, onEdit, onDelete, onRSVP, rsvped }) {
  const past = ap.date && new Date(ap.date) < new Date();
  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${past ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium uppercase">{ap.type}</span>
            {past && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Past</span>}
          </div>
          <p className="font-semibold text-foreground text-sm mt-1">{ap.title}</p>
        </div>
        {isOwner && (
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
        {ap.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(ap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}{ap.time_label ? ` · ${ap.time_label}` : ''}</span>}
        {ap.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ap.venue}{ap.city ? `, ${ap.city}` : ''}</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-muted-foreground">{ap.rsvp_count || 0} RSVP{(ap.rsvp_count || 0) === 1 ? '' : 's'}</span>
        {!isOwner && !past && (
          <Button size="sm" variant={rsvped ? 'secondary' : 'outline'} onClick={onRSVP} className="h-7 text-xs gap-1">
            {rsvped ? <><CheckCircle2 className="w-3 h-3" /> Going</> : 'RSVP'}
          </Button>
        )}
        {ap.ticket_url && <a href={ap.ticket_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1"><Ticket className="w-3 h-3" /> Tickets</a>}
      </div>
    </div>
  );
}

export default function AppearancesTab({ artistId, isOwner, currentUserId }) {
  const queryClient = useQueryClient();
  const { data: appearances = [], isLoading } = useQuery({
    queryKey: ['appearances', artistId],
    queryFn: () => base44.entities.Appearance.filter({ artist_id: artistId }, 'date', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [rsvping, setRsvping] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['appearances', artistId] });
  const saveNew = async (form) => { await base44.entities.Appearance.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.Appearance.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (ap) => { if (!window.confirm('Remove this appearance?')) return; await base44.entities.Appearance.delete(ap.id); refresh(); };

  const toggleRSVP = async (ap) => {
    if (!currentUserId) return;
    setRsvping(ap.id);
    const ids = ap.rsvped_user_ids || [];
    const going = ids.includes(currentUserId);
    const next = going ? ids.filter(id => id !== currentUserId) : [...ids, currentUserId];
    await base44.entities.Appearance.update(ap.id, { rsvped_user_ids: next, rsvp_count: next.length });
    setRsvping(null); refresh();
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const upcoming = appearances.filter(a => a.date && new Date(a.date) >= new Date());
  const past = appearances.filter(a => a.date && new Date(a.date) < new Date());

  return (
    <div className="space-y-5">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Appearance</Button>
        </div>
      )}
      {showForm && <AppearanceForm onSave={saveNew} onCancel={() => setShowForm(false)} />}

      {appearances.length === 0 && !showForm && <p className="text-center py-12 text-sm text-muted-foreground">No appearances scheduled.</p>}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</p>
          {upcoming.map(ap => editing?.id === ap.id
            ? <AppearanceForm key={ap.id} initial={ap} onSave={saveEdit} onCancel={() => setEditing(null)} />
            : <AppearanceCard key={ap.id} ap={ap} isOwner={isOwner} onEdit={() => setEditing(ap)} onDelete={() => del(ap)} onRSVP={() => toggleRSVP(ap)} rsvped={ap.rsvped_user_ids?.includes(currentUserId)} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Past</p>
          {past.map(ap => editing?.id === ap.id
            ? <AppearanceForm key={ap.id} initial={ap} onSave={saveEdit} onCancel={() => setEditing(null)} />
            : <AppearanceCard key={ap.id} ap={ap} isOwner={isOwner} onEdit={() => setEditing(ap)} onDelete={() => del(ap)} />)}
        </div>
      )}
    </div>
  );
}