import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Star, Trash2, Loader2, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform active:scale-90"
        >
          <Star
            className={`w-6 h-6 transition-colors ${(hovered || value) >= n ? 'text-gold fill-gold' : 'text-muted-foreground'}`}
          />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = 'sm' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${cls} ${value >= n ? 'text-gold fill-gold' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );
}

function RatingSummary({ reviews }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map(n => ({ n, c: reviews.filter(r => r.rating === n).length }));
  return (
    <div className="bg-secondary/40 rounded-xl p-4 flex gap-6 items-center">
      <div className="text-center flex-shrink-0">
        <p className="text-4xl font-bold text-foreground">{avg.toFixed(1)}</p>
        <StarDisplay value={Math.round(avg)} size="lg" />
        <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 space-y-1">
        {counts.map(({ n, c }) => (
          <div key={n} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-3">{n}</span>
            <Star className="w-3 h-3 text-gold fill-gold flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: reviews.length ? `${(c / reviews.length) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-muted-foreground w-4 text-right">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BusinessReviewsTab({ business, isOwner }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const reviews = business.hub_data?.reviews || [];

  const persist = async (updated) => {
    await base44.entities.BusinessPage.update(business.id, {
      hub_data: { ...(business.hub_data || {}), reviews: updated }
    });
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
  };

  const hasReviewed = user && reviews.some(r => r.user_id === user.id);

  const handleSubmit = async () => {
    if (!rating || !user) return;
    setSaving(true);
    const newReview = {
      id: Date.now().toString(),
      user_id: user.id,
      user_name: user.full_name,
      user_avatar: user.avatar_url,
      rating,
      body: body.trim(),
      created_at: new Date().toISOString(),
      helpful_count: 0,
    };
    await persist([newReview, ...reviews]);
    setRating(0);
    setBody('');
    setSaving(false);
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    await persist(reviews.filter(r => r.id !== reviewId));
  };

  const handleHelpful = async (reviewId) => {
    const updated = reviews.map(r =>
      r.id === reviewId ? { ...r, helpful_count: (r.helpful_count || 0) + 1 } : r
    );
    await persist(updated);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <RatingSummary reviews={reviews} />

      {/* Write a review */}
      {user && !hasReviewed && !isOwner && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Leave a Review</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
            placeholder="Share your experience… (optional)"
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            disabled={!rating || saving}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : 'Post Review'}
          </Button>
        </div>
      )}

      {hasReviewed && (
        <p className="text-sm text-muted-foreground text-center bg-secondary/40 rounded-xl py-3">
          You've already reviewed this business. Thank you!
        </p>
      )}

      {!user && (
        <p className="text-sm text-muted-foreground text-center bg-secondary/40 rounded-xl py-3">
          Sign in to leave a review.
        </p>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10 bg-secondary/30 rounded-xl">
          No reviews yet. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={review.user_avatar} />
                    <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{review.user_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-none">{review.user_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {review.created_at ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StarDisplay value={review.rating} />
                  {(isOwner || user?.id === review.user_id) && (
                    <button onClick={() => handleDelete(review.id)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {review.body && <p className="text-sm text-foreground leading-relaxed">{review.body}</p>}

              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Helpful{review.helpful_count > 0 ? ` (${review.helpful_count})` : ''}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}