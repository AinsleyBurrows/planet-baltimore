import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, MessageSquare, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

function fmtTime(d) {
  if (!d) return '';
  try {
    const date = new Date(d);
    const now = new Date();
    const diff = (now - date) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function FestivalCommentsTab({ festival }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  const canComment = !!festival?.id;

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (!canComment) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    base44.entities.Comment.filter({ target_type: 'festival', target_id: festival.id }, '-created_date', 200)
      .then(res => { if (!cancelled) setComments(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [festival?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !content.trim() || !canComment) return;
    setSubmitting(true);
    try {
      const created = await base44.entities.Comment.create({
        content: content.trim(),
        author_id: user.id,
        author_name: user.full_name,
        author_avatar: user.avatar_url,
        target_type: 'festival',
        target_id: festival.id,
      });
      setComments(prev => [created, ...prev]);
      setContent('');
    } catch {
      // bubble up
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Comment.delete(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch {
      // bubble up
    }
  };

  if (!canComment) {
    return (
      <div className="text-center py-10">
        <MessageSquare className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Comments are available for community-created festivals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {user ? (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-9 h-9 flex-shrink-0">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="bg-secondary text-foreground font-semibold text-sm">{user.full_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share your experience from this festival…"
                rows={3}
                className="w-full resize-none rounded-lg bg-secondary/50 border-0 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting || !content.trim()}
              className="gap-1.5 text-xs h-8 px-4 rounded-lg border-0"
              style={{ backgroundColor: '#d4580a', color: 'white' }}
            >
              <Send className="w-3.5 h-3.5" />{submitting ? 'Posting…' : 'Post Comment'}
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted-foreground">
          <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          Log in to leave a comment about your experience.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-muted border-t-[#d4580a] rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center py-10 text-sm text-muted-foreground">No comments yet. Be the first to share your experience!</p>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={c.author_avatar} />
                  <AvatarFallback className="bg-secondary text-foreground font-semibold text-sm">{c.author_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">{c.author_name || 'Attendee'}</p>
                    <span className="text-xs text-muted-foreground">{fmtTime(c.created_date)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
                </div>
                {user && c.author_id === user.id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}