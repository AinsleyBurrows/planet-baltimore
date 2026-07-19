import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Star, Quote, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLATFORMS = ['Apple Podcasts', 'Spotify', 'Podchaser', 'Goodpods', 'Google', 'Other'];

function ReviewForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { source: '', author: '', quote: '', rating: '', date: '', link: '', platform: 'Apple Podcasts' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Platform / outlet *" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
        <select className="w-36 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Reviewer / author name" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-24" placeholder="Review / rating text *" value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} />
      <div className="flex gap-2">
        <select className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value === '' ? '' : Number(e.target.value) }))}>
          <option value="">Rating</option>
          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link to review" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
        <input className="w-36 px-3 py-2 rounded-lg border border-input bg-background text-sm" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      </div>
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0"><Star className="w-4 h-4 text-accent" /></div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{review.source}</p>
            <div className="flex items-center gap-2">
              {review.platform && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{review.platform}</span>}
              {review.author && <span className="text-[10px] text-muted-foreground">— {review.author}</span>}
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

export default function PodcastReviewsTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const reviews = artist.podcast_reviews || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });

  const save = async (form) => {
    setSaving(true);
    if (editing != null) {
      const updated = reviews.map((r, i) => i === editing ? form : r);
      await base44.entities.ArtistPage.update(artist.id, { podcast_reviews: updated });
      setEditing(null);
    } else {
      await base44.entities.ArtistPage.update(artist.id, { podcast_reviews: [form, ...reviews] });
      setShowForm(false);
    }
    setSaving(false); refresh();
  };

  const del = async (idx) => {
    if (!window.confirm('Remove this review?')) return;
    const updated = reviews.filter((_, i) => i !== idx);
    await base44.entities.ArtistPage.update(artist.id, { podcast_reviews: updated });
    refresh();
  };

  const avg = reviews.filter(r => r.rating > 0);
  const avgRating = avg.length ? (avg.reduce((s, r) => s + r.rating, 0) / avg.length).toFixed(1) : null;

  return (
    <div className="space-y-4">
      {reviews.length > 0 && avgRating && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{avgRating}</p>
            <div className="flex items-center gap-0.5 justify-center mt-0.5">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-gold text-gold' : 'text-muted-foreground/30'}`} />)}
            </div>
          </div>
          <div className="h-10 w-px bg-border" />
          <p className="text-sm text-muted-foreground">Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''} across platforms.</p>
        </div>
      )}

      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Review</Button>
        </div>
      )}
      {showForm && <ReviewForm onSave={save} onCancel={() => setShowForm(false)} />}

      {reviews.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No reviews yet.</p>
        : <div className="space-y-3">{reviews.map((r, i) => editing === i ? <ReviewForm key={i} initial={r} onSave={save} onCancel={() => setEditing(null)} /> : <ReviewCard key={i} review={r} isOwner={isOwner} onEdit={() => setEditing(i)} onDelete={() => del(i)} />)}</div>}
    </div>
  );
}