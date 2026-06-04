import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil, ExternalLink, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PLATFORMS = [
  { key: 'spotify', label: 'Spotify', emoji: '🎧', color: 'bg-green-500', textColor: 'text-white' },
  { key: 'apple_podcasts', label: 'Apple Podcasts', emoji: '🍎', color: 'bg-purple-600', textColor: 'text-white' },
  { key: 'youtube', label: 'YouTube', emoji: '▶️', color: 'bg-red-600', textColor: 'text-white' },
  { key: 'amazon_music', label: 'Amazon Music', emoji: '🎵', color: 'bg-blue-500', textColor: 'text-white' },
  { key: 'rss', label: 'RSS Feed', emoji: '📡', color: 'bg-orange-500', textColor: 'text-white' },
];

export default function PodcastListenOnTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const links = artist.podcast_links || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(links);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.ArtistPage.update(artist.id, { podcast_links: form });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    setEditing(false);
    setSaving(false);
  };

  const activePlatforms = PLATFORMS.filter(p => links[p.key]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Listen On</h2>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => { setForm(links); setEditing(!editing); }} className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> {editing ? 'Cancel' : 'Edit Links'}
          </Button>
        )}
      </div>

      {isOwner && editing && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {PLATFORMS.map(p => (
            <div key={p.key}>
              <Label className="text-xs text-muted-foreground mb-1 block">{p.emoji} {p.label}</Label>
              <Input
                placeholder={`${p.label} URL`}
                value={form[p.key] || ''}
                onChange={e => setForm(f => ({ ...f, [p.key]: e.target.value }))}
              />
            </div>
          ))}
          <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      )}

      {!editing && (
        activePlatforms.length === 0 ? (
          <div className="text-center py-14">
            <Headphones className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No streaming links added yet.</p>
            {isOwner && <p className="text-xs text-muted-foreground mt-1">Add your podcast links so listeners can find you everywhere.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PLATFORMS.filter(p => links[p.key]).map(p => (
              <a key={p.key} href={links[p.key]} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-3 px-5 py-4 rounded-xl ${p.color} ${p.textColor} font-semibold text-sm transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98]`}>
                <span className="text-2xl">{p.emoji}</span>
                <span className="flex-1">{p.label}</span>
                <ExternalLink className="w-4 h-4 opacity-70" />
              </a>
            ))}
          </div>
        )
      )}
    </div>
  );
}