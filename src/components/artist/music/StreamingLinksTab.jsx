import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

const PLATFORMS = [
  { key: 'spotify', label: 'Spotify', icon: '🎵', color: 'bg-green-500 hover:bg-green-600', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'apple_music', label: 'Apple Music', icon: '🍎', color: 'bg-pink-500 hover:bg-pink-600', placeholder: 'https://music.apple.com/artist/...' },
  { key: 'soundcloud', label: 'SoundCloud', icon: '☁️', color: 'bg-orange-500 hover:bg-orange-600', placeholder: 'https://soundcloud.com/...' },
  { key: 'youtube', label: 'YouTube', icon: '▶️', color: 'bg-red-600 hover:bg-red-700', placeholder: 'https://youtube.com/@...' },
  { key: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 hover:opacity-90', placeholder: 'https://instagram.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: '🎶', color: 'bg-black hover:bg-black/80', placeholder: 'https://tiktok.com/@...' },
  { key: 'bandcamp', label: 'Bandcamp', icon: '🎸', color: 'bg-teal-600 hover:bg-teal-700', placeholder: 'https://yourname.bandcamp.com' },
  { key: 'twitter', label: 'X / Twitter', icon: '𝕏', color: 'bg-neutral-800 hover:bg-black', placeholder: 'https://x.com/...' },
];

export default function StreamingLinksTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const links = artist.streaming_links || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...links });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.ArtistPage.update(artist.id, { streaming_links: form });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    setEditing(false);
    setSaving(false);
  };

  const hasAny = PLATFORMS.some(p => links[p.key]);

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          {editing
            ? <div className="flex gap-2">
                <Button size="sm" onClick={save} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
                <Button size="sm" variant="outline" onClick={() => { setForm({ ...links }); setEditing(false); }}>Cancel</Button>
              </div>
            : <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit Links</Button>
          }
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          {PLATFORMS.map(p => (
            <div key={p.key} className="flex items-center gap-3">
              <span className="text-lg w-7 text-center">{p.icon}</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">{p.label}</p>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                  placeholder={p.placeholder}
                  value={form[p.key] || ''}
                  onChange={e => setForm(f => ({ ...f, [p.key]: e.target.value }))}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {!hasAny && (
            <p className="text-center py-12 text-sm text-muted-foreground">
              {isOwner ? 'Add your streaming and social links.' : 'No streaming links added yet.'}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PLATFORMS.filter(p => links[p.key]).map(p => (
              <a
                key={p.key}
                href={links[p.key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium text-sm transition-all active:scale-95 shadow-sm ${p.color}`}
              >
                <span className="text-lg">{p.icon}</span>
                {p.label}
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}