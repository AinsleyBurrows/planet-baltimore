import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const UPDATE_TYPES = ['Announcement', 'Schedule Change', 'Weather Alert', 'Emergency'];

export default function FestivalUpdateComposer({ festival, onUpdated }) {
  const { user } = useCurrentUser();
  const [type, setType] = useState('Announcement');
  const [message, setMessage] = useState('');
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState(null);

  if (!festival?.id) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    setResult(null);
    try {
      const newUpdate = {
        type,
        message: trimmed,
        timestamp: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
      const updatedUpdates = [...(festival.updates || []), newUpdate];
      await base44.entities.Festival.update(festival.id, { updates: updatedUpdates });

      const resp = await base44.functions.invoke('notifyFestivalFollowers', {
        festivalId: festival.id,
        festivalName: festival.name,
        festivalSlug: festival.slug,
        organizerName: user?.full_name || festival.organizer?.name || festival.name,
        update: newUpdate,
      });
      const notified = resp?.data?.notified ?? 0;

      onUpdated?.({ ...festival, updates: updatedUpdates });
      setMessage('');
      setType('Announcement');
      setResult({
        kind: 'success',
        text: `Update posted — ${notified} follower${notified === 1 ? '' : 's'} notified.`,
      });
    } catch (err) {
      setResult({
        kind: 'error',
        text: err?.message || 'Could not notify followers. The update was not saved.',
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="w-4 h-4 text-[#d4580a]" />
        <h3 className="font-semibold text-foreground text-sm">Post an Update</h3>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Followers of this festival receive a notification when you post.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {UPDATE_TYPES.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => setType(t)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              type === t
                ? 'border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10'
                : 'border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Share a schedule change, weather alert, or announcement..."
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="flex items-center justify-between gap-2">
        {result ? (
          <p
            className={`text-xs flex items-center gap-1.5 ${
              result.kind === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {result.kind === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {result.text}
          </p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={posting || !message.trim()}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#d4580a' }}
        >
          {posting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Megaphone className="w-4 h-4" />
          )}
          {posting ? 'Posting...' : 'Post & Notify'}
        </button>
      </div>
    </form>
  );
}