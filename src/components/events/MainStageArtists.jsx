import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ArtistFormModal({ artist, onClose, onSaved }) {
  const [name, setName] = useState(artist?.name || '');
  const [bio, setBio] = useState(artist?.bio || '');
  const [rsvpUrl, setRsvpUrl] = useState(artist?.rsvp_url || '');
  const [photoUrl, setPhotoUrl] = useState(artist?.photo_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setPhotoUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const data = { name: name.trim(), bio: bio.trim(), rsvp_url: rsvpUrl.trim(), photo_url: photoUrl };
    if (artist?.id) {
      await base44.entities.MainStageArtist.update(artist.id, data);
    } else {
      await base44.entities.MainStageArtist.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-foreground">{artist ? 'Edit Artist' : 'Add Featured Artist'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Photo upload */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-secondary overflow-hidden flex items-center justify-center shrink-0">
            {photoUrl
              ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
              : <span className="text-3xl font-bold text-muted-foreground">{name.charAt(0) || '?'}</span>
            }
          </div>
          <label className="cursor-pointer">
            <span className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent transition-colors">
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>

        <Input placeholder="Artist Name *" value={name} onChange={e => setName(e.target.value)} />
        <textarea
          placeholder="Short bio..."
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
        />
        <Input placeholder="RSVP Link (https://...)" value={rsvpUrl} onChange={e => setRsvpUrl(e.target.value)} />

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function MainStageArtists({ isAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: artists = [] } = useQuery({
    queryKey: ['main-stage-artists'],
    queryFn: () => base44.entities.MainStageArtist.list('sort_order', 50),
  });

  const handleDelete = async (id) => {
    if (!confirm('Remove this artist?')) return;
    await base44.entities.MainStageArtist.delete(id);
    queryClient.invalidateQueries({ queryKey: ['main-stage-artists'] });
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['main-stage-artists'] });
  };

  if (artists.length === 0 && !isAdmin) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Featured Artists</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />Add Artist
          </button>
        )}
      </div>

      {artists.length === 0 && isAdmin && (
        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
          No featured artists yet. Add one above.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {artists.map(artist => (
          <div key={artist.id} className="bg-card border border-border rounded-xl overflow-hidden flex gap-4 p-4">
            {/* Photo */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-secondary overflow-hidden shrink-0">
              {artist.photo_url
                ? <img src={artist.photo_url} alt={artist.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">{artist.name?.charAt(0)}</div>
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">{artist.name}</p>
              {artist.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">{artist.bio}</p>}
              {artist.rsvp_url && (
                <a
                  href={artist.rsvp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />RSVP
                </a>
              )}
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => setEditing(artist)} className="p-1.5 rounded-md text-muted-foreground hover:text-accent hover:bg-secondary transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(artist.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(showForm || editing) && (
        <ArtistFormModal
          artist={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}