import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, Loader2, CheckCircle2, AlertCircle, ImagePlus, X } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const UPDATE_TYPES = ['Announcement', 'Schedule Change', 'Weather Alert', 'Emergency'];

export default function FestivalUpdateComposer({ festival, onUpdated }) {
  const { user } = useCurrentUser();
  const [type, setType] = useState('Announcement');
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState([]); // {url, name}
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  if (!festival?.id) return null;

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) uploaded.push({ url: file_url, name: file.name });
      }
      setPhotos((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setResult({ kind: 'error', text: err?.message || 'Photo upload failed.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = (idx) => setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if ((!trimmed && photos.length === 0) || posting) return;
    setPosting(true);
    setResult(null);
    try {
      const newUpdate = {
        type,
        message: trimmed,
        media_urls: photos.map((p) => p.url),
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
      setPhotos([]);
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

      {/* Photo uploads */}
      <div className="space-y-2">
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photos.map((p, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted group">
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ImagePlus className="w-3.5 h-3.5" />
          )}
          {uploading ? 'Uploading...' : 'Add Photos'}
        </button>
      </div>

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
          disabled={posting || uploading || (!message.trim() && photos.length === 0)}
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