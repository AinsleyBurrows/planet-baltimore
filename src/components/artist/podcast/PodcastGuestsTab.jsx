import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PodcastGuestsTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const guests = artist.podcast_guests || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', bio: '', episode_title: '', episode_url: '', image_url: '' });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const updated = [...guests, { ...form, id: Date.now().toString() }];
    await base44.entities.ArtistPage.update(artist.id, { podcast_guests: updated });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    setForm({ name: '', title: '', bio: '', episode_title: '', episode_url: '', image_url: '' });
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const updated = guests.filter(g => g.id !== id);
    await base44.entities.ArtistPage.update(artist.id, { podcast_guests: updated });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Past & Upcoming Guests</h2>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Guest
          </Button>
        )}
      </div>

      {isOwner && showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">New Guest</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Guest name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder="Title / role (e.g. Author, Activist)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input placeholder="Short bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            <Input placeholder="Episode title (optional)" value={form.episode_title} onChange={e => setForm(f => ({ ...f, episode_title: e.target.value }))} />
            <Input placeholder="Episode link (Spotify, YouTube…)" value={form.episode_url} onChange={e => setForm(f => ({ ...f, episode_url: e.target.value }))} />
            <Input placeholder="Guest photo URL (optional)" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save Guest'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {guests.length === 0 ? (
        <div className="text-center py-14">
          <Mic2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No guests added yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Add past or upcoming guests to showcase your conversations.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guests.map(guest => (
            <div key={guest.id} className="flex gap-3 p-4 bg-card border border-border rounded-xl relative group">
              {guest.image_url ? (
                <img src={guest.image_url} alt={guest.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent font-bold text-xl">
                  {guest.name?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{guest.name}</p>
                {guest.title && <p className="text-xs text-accent mt-0.5">{guest.title}</p>}
                {guest.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{guest.bio}</p>}
                {guest.episode_url && (
                  <a href={guest.episode_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-1.5">
                    <ExternalLink className="w-3 h-3" />
                    {guest.episode_title || 'Listen to Episode'}
                  </a>
                )}
              </div>
              {isOwner && (
                <button onClick={() => handleDelete(guest.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}