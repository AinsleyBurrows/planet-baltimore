import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Music, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const EMPTY = { title: '', type: 'single', release_date: '', cover_url: '', spotify_url: '', apple_music_url: '', soundcloud_url: '', bandcamp_url: '', other_url: '' };

const TYPE_COLORS = { album: 'bg-primary/10 text-primary', ep: 'bg-accent/10 text-accent', single: 'bg-secondary text-secondary-foreground' };

function ReleaseForm({ initial, onSave, onCancel, saving, artistId }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const uploadCover = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center"
          onClick={() => fileRef.current?.click()}>
          {form.cover_url ? <img src={form.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-7 h-7 text-muted-foreground" />}
          {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="flex gap-2">
            {['album', 'ep', 'single'].map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${form.type === t ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'}`}>
                {t}
              </button>
            ))}
          </div>
          <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.release_date} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} />
        </div>
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Spotify URL" value={form.spotify_url} onChange={e => setForm(f => ({ ...f, spotify_url: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Apple Music URL" value={form.apple_music_url} onChange={e => setForm(f => ({ ...f, apple_music_url: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="SoundCloud URL" value={form.soundcloud_url} onChange={e => setForm(f => ({ ...f, soundcloud_url: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Bandcamp URL" value={form.bandcamp_url} onChange={e => setForm(f => ({ ...f, bandcamp_url: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Other Link" value={form.other_url} onChange={e => setForm(f => ({ ...f, other_url: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || uploading || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadCover(e.target.files[0])} />
    </div>
  );
}

export default function DiscographyTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const releases = artist.discography || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtistPage.update(artist.id, { discography: list });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([form, ...releases]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save(releases.map((r, i) => i === editIdx ? { ...r, ...form } : r)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this release?')) return; await save(releases.filter((_, i) => i !== idx)); };

  const streamLinks = (r) => [
    { label: 'Spotify', url: r.spotify_url, color: 'bg-green-500' },
    { label: 'Apple', url: r.apple_music_url, color: 'bg-pink-500' },
    { label: 'SoundCloud', url: r.soundcloud_url, color: 'bg-orange-500' },
    { label: 'Bandcamp', url: r.bandcamp_url, color: 'bg-teal-600' },
    { label: 'Listen', url: r.other_url, color: 'bg-primary' },
  ].filter(l => l.url);

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Release
          </Button>
        </div>
      )}
      {showForm && <ReleaseForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} artist={artist} />}

      {releases.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No releases added yet.</p>
      ) : (
        <div className="space-y-3">
          {releases.map((r, i) => (
            editIdx === i
              ? <ReleaseForm key={i} initial={r} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} artist={artist} />
              : (
                <div key={i} className="flex gap-3 p-3 bg-card border border-border rounded-xl">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                    {r.cover_url ? <img src={r.cover_url} alt={r.title} className="w-full h-full object-cover" /> : <Music className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{r.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className={`text-[10px] capitalize ${TYPE_COLORS[r.type]}`}>{r.type}</Badge>
                          {r.release_date && <span className="text-xs text-muted-foreground">{format(new Date(r.release_date), 'MMM yyyy')}</span>}
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setEditIdx(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {streamLinks(r).map(l => (
                        <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-medium ${l.color}`}>
                          <ExternalLink className="w-2.5 h-2.5" />{l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )
          ))}
        </div>
      )}
    </div>
  );
}