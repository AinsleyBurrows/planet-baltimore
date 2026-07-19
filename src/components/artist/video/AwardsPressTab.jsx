import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Trophy, ExternalLink, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const TYPES = [
  { value: 'award', label: 'Award' },
  { value: 'official_selection', label: 'Official Selection' },
  { value: 'laurel', label: 'Laurel' },
  { value: 'press_review', label: 'Press Review' },
  { value: 'media_mention', label: 'Media Mention' },
  { value: 'interview', label: 'Interview' },
];

function AwardForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', type: 'award', source: '', quote: '', date: '', link: '' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title (award / selection name) *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Festival / publication / outlet" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Quote / blurb (optional)" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
      <div className="flex gap-2">
        <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link (optional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function AwardCard({ item, isOwner, onEdit, onDelete }) {
  const typeLabel = TYPES.find(t => t.value === item.type)?.label || item.type;
  const isPress = item.type === 'press_review' || item.type === 'media_mention' || item.type === 'interview';
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {isPress ? <Quote className="w-6 h-6 text-accent/30" /> : <Trophy className="w-6 h-6 text-yellow-500/70" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{typeLabel}</span>
                {item.date && <span className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM yyyy')}</span>}
              </div>
              <p className="font-semibold text-foreground text-sm">{item.title}</p>
              {item.source && <p className="text-xs text-muted-foreground mt-0.5">{item.source}</p>}
              {item.quote && <p className="text-sm text-foreground leading-relaxed italic mt-1.5">"{item.quote}"</p>}
              {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline text-xs mt-2"><ExternalLink className="w-3.5 h-3.5" />View</a>}
            </div>
            {isOwner && (
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AwardsPressTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['video-awards', artistId],
    queryFn: () => base44.entities.VideoAward.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['video-awards', artistId] });
  const saveNew = async (form) => { await base44.entities.VideoAward.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.VideoAward.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (a) => { if (!window.confirm('Remove this entry?')) return; await base44.entities.VideoAward.delete(a.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Award / Press</Button>
        </div>
      )}
      {showForm && <AwardForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {items.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No awards or press added yet.</p>
        : <div className="space-y-3">{items.map(a => editing?.id === a.id ? <AwardForm key={a.id} initial={a} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <AwardCard key={a.id} item={a} isOwner={isOwner} onEdit={() => setEditing(a)} onDelete={() => del(a)} />)}</div>}
    </div>
  );
}