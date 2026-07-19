import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Star, Quote, ExternalLink, Award, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const TYPES = [
  { value: 'review', label: 'Review', icon: Star },
  { value: 'blurb', label: 'Blurb', icon: Quote },
  { value: 'award', label: 'Award', icon: Award },
  { value: 'interview', label: 'Interview', icon: Mic },
  { value: 'media_mention', label: 'Media Mention', icon: ExternalLink },
];

function ReviewForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { source: '', quote: '', rating: '', date: '', link: '', type: 'review' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Source / outlet (e.g. 'The New Yorker') *" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
        <select className="w-36 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-24" placeholder="Quote / blurb / review text *" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
      <div className="flex gap-2">
        <select className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value === '' ? '' : Number(e.target.value) }))}>
          <option value="">Rating</option>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link to full review" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
        <input className="w-40 px-3 py-2 rounded-lg border border-input bg-background text-sm" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.source || !form.quote} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ReviewCard({ review, isOwner, onEdit, onDelete }) {
  const typeMeta = TYPES.find(t => t.value === review.type) || TYPES[0];
  const Icon = typeMeta.icon;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-accent" /></div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{review.source}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase">{typeMeta.label}</span>
              {review.date && <span className="text-[10px] text-muted-foreground">{new Date(review.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
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
      {review.rating > 0 && (
        <div className="flex items-center gap-0.5 mt-2">
          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-gold text-gold' : 'text-muted-foreground/30'}`} />)}
        </div>
      )}
      <div className="relative mt-2 pl-4">
        <Quote className="absolute left-0 top-0 w-3 h-3 text-accent/40" />
        <p className="text-sm text-foreground italic leading-relaxed">{review.quote}</p>
      </div>
      {review.link && <a href={review.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">Read more <ExternalLink className="w-3 h-3" /></a>}
    </div>
  );
}

export default function PressReviewsTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['literary-reviews', artistId],
    queryFn: () => base44.entities.LiteraryReview.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['literary-reviews', artistId] });
  const saveNew = async (form) => { await base44.entities.LiteraryReview.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.LiteraryReview.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (r) => { if (!window.confirm('Remove this entry?')) return; await base44.entities.LiteraryReview.delete(r.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Press</Button>
        </div>
      )}
      {showForm && <ReviewForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {reviews.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No press or reviews yet.</p>
        : <div className="space-y-3">{reviews.map(r => editing?.id === r.id ? <ReviewForm key={r.id} initial={r} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ReviewCard key={r.id} review={r} isOwner={isOwner} onEdit={() => setEditing(r)} onDelete={() => del(r)} />)}</div>}
    </div>
  );
}