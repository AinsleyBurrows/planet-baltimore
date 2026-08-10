import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Loader2, Plus, Check, X, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function StarRating({ value, onChange, readOnly, size }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${n} star`}
        >
          <Star
            className={`${size || 'w-4 h-4'} ${n <= display ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ r, showActions, onApprove, onReject }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
            {r.reviewer_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">{r.reviewer_name}</p>
            <StarRating value={r.rating || 0} readOnly size="w-3.5 h-3.5" />
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {r.created_date ? new Date(r.created_date).toLocaleDateString() : ''}
        </span>
      </div>
      {r.title && <p className="font-serif text-base font-medium text-foreground mt-3">{r.title}</p>}
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{r.comment}</p>
      {showActions && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => onApprove(r.id)}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
          >
            <Check className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject(r.id)}
            className="gap-1.5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ArtistReviewsTab({ artistId, ownerId, isOwner, artistName }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ reviewer_name: '', rating: 0, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: approved = [], isLoading } = useQuery({
    queryKey: ['artist-reviews-approved', artistId],
    queryFn: () => base44.entities.ArtistReview.filter({ artist_id: artistId, status: 'approved' }, '-created_date', 200),
    enabled: !!artistId,
  });

  const { data: pending = [] } = useQuery({
    queryKey: ['artist-reviews-pending', artistId],
    queryFn: () => base44.entities.ArtistReview.filter({ artist_id: artistId, status: 'pending' }, '-created_date', 200),
    enabled: !!artistId && isOwner,
  });

  const avg = approved.length ? approved.reduce((s, r) => s + (r.rating || 0), 0) / approved.length : 0;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['artist-reviews-approved', artistId] });
    queryClient.invalidateQueries({ queryKey: ['artist-reviews-pending', artistId] });
  };

  const submit = async () => {
    setError('');
    if (!form.reviewer_name.trim()) return setError('Please enter your name.');
    if (form.rating < 1) return setError('Please select a rating.');
    if (!form.comment.trim()) return setError('Please write a comment.');
    setSubmitting(true);
    try {
      await base44.entities.ArtistReview.create({
        artist_id: artistId,
        artist_owner_id: ownerId,
        reviewer_name: form.reviewer_name.trim(),
        reviewer_email: user?.email || '',
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
        status: 'pending',
      });
      setForm({ reviewer_name: '', rating: 0, title: '', comment: '' });
      setShowForm(false);
      refresh();
    } catch (e) {
      setError('Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (id) => {
    await base44.entities.ArtistReview.update(id, { status: 'approved' });
    refresh();
  };
  const reject = async (id) => {
    await base44.entities.ArtistReview.update(id, { status: 'rejected' });
    refresh();
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-serif text-lg font-medium text-foreground">Collector Reviews</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ratings and comments from collectors who have engaged with {artistName}'s work.
          </p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground leading-none">{avg.toFixed(1)}</p>
          <div className="flex justify-center mt-1">
            <StarRating value={Math.round(avg)} readOnly size="w-3 h-3" />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {approved.length} review{approved.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Submit CTA (hidden for the artist owner) */}
      {!isOwner && (
        <div>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Leave a Review
            </button>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground text-sm">Share your experience</p>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  placeholder="Your name *"
                  value={form.reviewer_name}
                  onChange={(e) => setForm((f) => ({ ...f, reviewer_name: e.target.value }))}
                />
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background">
                  <span className="text-xs text-muted-foreground">Your rating:</span>
                  <StarRating value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
                </div>
              </div>
              <input
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                placeholder="Review title (optional)"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-24"
                placeholder="Tell others about your experience with this artist's work *"
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={submit}
                  disabled={submitting}
                  className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}{' '}
                  Submit for Approval
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Your review will be visible once {artistName} approves it.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Owner: pending approval queue */}
      {isOwner && pending.length > 0 && (
        <div className="space-y-3">
          <p className="font-serif text-base font-medium text-foreground flex items-center gap-2">
            <Quote className="w-4 h-4" /> Pending Approval ({pending.length})
          </p>
          {pending.map((r) => (
            <ReviewCard key={r.id} r={r} showActions onApprove={approve} onReject={reject} />
          ))}
        </div>
      )}

      {/* Approved reviews list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : approved.length === 0 ? (
        <div className="text-center py-12">
          <Quote className="w-9 h-9 mx-auto mb-3 opacity-25" />
          <p className="font-serif text-base text-muted-foreground">No reviews yet.</p>
          {!isOwner && <p className="text-xs text-muted-foreground mt-1">Be the first to leave a review.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {approved.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}