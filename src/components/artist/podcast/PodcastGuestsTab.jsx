import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink, Mic2, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

      {/* Guest Request Form — visible to non-owners */}
      {!isOwner && <GuestRequestForm artistPageId={artist.id} podcastName={artist.name} />}
    </div>
  );
}

function GuestRequestForm({ artistPageId, podcastName }) {
  const [form, setForm] = useState({ name: '', type: 'local_artist', email: '', pitch: '', social_or_website: '' });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.PodcastGuestRequest.create({ ...form, artist_page_id: artistPageId, podcast_name: podcastName });
    setSubmitted(true);
    setSaving(false);
  };

  if (submitted) {
    return (
      <div className="border border-border rounded-xl p-6 text-center bg-card mt-6">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="font-semibold text-foreground">Request sent!</p>
        <p className="text-sm text-muted-foreground mt-1">The host will be in touch if it's a fit.</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl p-5 bg-card mt-6 space-y-4">
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-accent" /> Want to be a guest?
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Local artists and business owners can pitch themselves here.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input required placeholder="Your name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input required type="email" placeholder="Email address *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <select
          value={form.type}
          onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
        >
          <option value="local_artist">Local Artist</option>
          <option value="business_owner">Business Owner</option>
          <option value="other">Other</option>
        </select>
        <Input placeholder="Website or social link (optional)" value={form.social_or_website} onChange={e => setForm(f => ({ ...f, social_or_website: e.target.value }))} />
        <Textarea
          required
          placeholder="Why would you make a great guest? What's your story? *"
          value={form.pitch}
          onChange={e => setForm(f => ({ ...f, pitch: e.target.value }))}
          className="min-h-[90px] resize-none"
        />
        <Button type="submit" disabled={saving} className="w-full gap-2">
          <Send className="w-4 h-4" />
          {saving ? 'Sending…' : 'Send Guest Request'}
        </Button>
      </form>
    </div>
  );
}