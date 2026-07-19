import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Star, ExternalLink, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

function ReviewForm({ artistId, initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { source: '', quote: '', rating: 0, date: '', link: '' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Source / outlet / award body *" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Quote / blurb *" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setForm(f => ({ ...f, rating: f.rating === n ? 0 : n }))}>
              <Star className={`w-5 h-5 ${n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40'}`} />
            </button>
          ))}
        </div>
        <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link to full review (optional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.source || !form.quote} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ReviewCard({ review, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Quote className="w-6 h-6 text-accent/30 flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              {review.rating > 0 && <div className="flex gap-0.5 mb-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />)}</div>}
              <p className="text-sm text-foreground leading-relaxed italic">"{review.quote}"</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs font-semibold text-foreground">— {review.source}</span>
                {review.date && <span className="text-xs text-muted-foreground">{format(new Date(review.date), 'MMM yyyy')}</span>}
                {review.link && <a href={review.link} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline"><ExternalLink className="w-3.5 h-3.5" /></a>}
              </div>
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

export default function ReviewsTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['performance-reviews', artistId],
    queryFn: () => base44.entities.PerformanceReview.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['performance-reviews', artistId] });

  const saveNew = async (form) => { await base44.entities.PerformanceReview.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.PerformanceReview.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (r) => { if (!window.confirm('Remove this review?')) return; await base44.entities.PerformanceReview.delete(r.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Review</Button>
        </div>
      )}
      {showForm && <ReviewForm artistId={artistId} onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {reviews.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No reviews or recognition added yet.</p>
        : <div className="space-y-3">{reviews.map(r => editing?.id === r.id ? <ReviewForm key={r.id} artistId={artistId} initial={r} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ReviewCard key={r.id} review={r} isOwner={isOwner} onEdit={() => setEditing(r)} onDelete={() => del(r)} />)}</div>}
    </div>
  );
}