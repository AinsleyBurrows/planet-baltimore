import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, MapPin, Calendar, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const EMPTY = { date: '', venue: '', city: '', ticket_url: '', notes: '' };

function ShowForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue Name *" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="City / Location" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Ticket URL" value={form.ticket_url} onChange={e => setForm(f => ({ ...f, ticket_url: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Notes (e.g. Opening for...)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.venue} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function TourDatesTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const shows = (artist.tour_dates || []).sort((a, b) => new Date(a.date) - new Date(b.date));
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtistPage.update(artist.id, { tour_dates: list });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([...(artist.tour_dates || []), form]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save((artist.tour_dates || []).map((s, i) => i === editIdx ? { ...s, ...form } : s)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this show?')) return; await save((artist.tour_dates || []).filter((_, i) => i !== idx)); };

  const upcoming = shows.filter(s => !s.date || new Date(s.date) >= new Date());
  const past = shows.filter(s => s.date && new Date(s.date) < new Date());

  const ShowCard = ({ s, i }) => (
    editIdx === i
      ? <ShowForm key={i} initial={s} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
      : (
        <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
          {s.date && (
            <div className="w-12 flex-shrink-0 text-center">
              <p className="text-xs font-bold text-accent uppercase">{format(new Date(s.date), 'MMM')}</p>
              <p className="text-xl font-bold text-foreground leading-none">{format(new Date(s.date), 'd')}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(s.date), 'yyyy')}</p>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm">{s.venue}</p>
            {s.city && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{s.city}</p>}
            {s.date && <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(s.date), 'h:mm a')}</p>}
            {s.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{s.notes}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {s.ticket_url && (
              <a href={s.ticket_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium">
                <Ticket className="w-3 h-3" />Tickets
              </a>
            )}
            {isOwner && (
              <div className="flex gap-1">
                <button onClick={() => setEditIdx(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        </div>
      )
  );

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Show
          </Button>
        </div>
      )}
      {showForm && <ShowForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}

      {shows.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No tour dates added yet.</p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
              {upcoming.map((s, i) => <ShowCard key={i} s={s} i={(artist.tour_dates || []).indexOf(s)} />)}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-2 opacity-60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past Shows</p>
              {past.map((s, i) => <ShowCard key={i} s={s} i={(artist.tour_dates || []).indexOf(s)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}