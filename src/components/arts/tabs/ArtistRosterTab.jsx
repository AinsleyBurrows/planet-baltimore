import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ArtistRosterTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const roster = org.artist_roster || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', bio: '', image_url: '', website: '' });

  const save = async () => {
    setSaving(true);
    const updated = [...roster, { ...form }];
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm({ name: '', bio: '', image_url: '', website: '' });
    setSaving(false);
  };

  const remove = async (idx) => {
    const updated = roster.filter((_, i) => i !== idx);
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Artist
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Artist Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Short bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Photo URL (optional)" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Website / Portfolio URL (optional)" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.name} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {roster.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No artists listed yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roster.map((artist, i) => (
            <div key={i} className="flex gap-3 p-4 bg-card border border-border rounded-xl">
              <Avatar className="w-14 h-14 rounded-xl flex-shrink-0">
                <AvatarImage src={artist.image_url} />
                <AvatarFallback className="rounded-xl bg-accent/10 text-accent font-bold text-lg">{artist.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-foreground">{artist.name}</p>
                  {isOwner && (
                    <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {artist.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{artist.bio}</p>}
                {artist.website && (
                  <a href={artist.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline mt-1">
                    <Globe className="w-3 h-3" />Portfolio
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}