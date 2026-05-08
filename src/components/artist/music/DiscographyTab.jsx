import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Music, ExternalLink, Upload, Play, Pause, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const EMPTY = {
  title: '', type: 'album', release_date: '', cover_url: '',
  spotify_url: '', apple_music_url: '', soundcloud_url: '', bandcamp_url: '', other_url: '',
  tracks: []
};

const TYPE_COLORS = { album: 'bg-primary/10 text-primary', ep: 'bg-accent/10 text-accent', single: 'bg-secondary text-secondary-foreground' };

function TrackPlayer({ track }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggle = () => {
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else { audioRef.current?.play(); setPlaying(true); }
  };

  if (!track.audio_url) return null;

  return (
    <>
      <audio ref={audioRef} src={track.audio_url} onEnded={() => setPlaying(false)} preload="metadata" />
      <button onClick={toggle} className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 hover:bg-accent/80 transition-colors">
        {playing ? <Pause className="w-3.5 h-3.5 text-accent-foreground" /> : <Play className="w-3.5 h-3.5 text-accent-foreground ml-0.5" />}
      </button>
    </>
  );
}

function TrackUploadRow({ track, index, onRemove, onTitleChange }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0">{index + 1}</span>
      <TrackPlayer track={track} />
      <input
        className="flex-1 px-2 py-1 rounded-md border border-input bg-background text-xs"
        placeholder="Track title"
        value={track.title}
        onChange={e => onTitleChange(index, e.target.value)}
      />
      <button onClick={() => onRemove(index)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function ReleaseForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  const coverRef = useRef(null);
  const trackRef = useRef(null);

  const uploadCover = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_url: file_url }));
    setUploading(false);
  };

  const uploadTracks = async (files) => {
    setUploadingTrack(true);
    const uploaded = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const title = file.name.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-\s]+/, '');
      uploaded.push({ title, audio_url: file_url });
    }
    setForm(f => ({ ...f, tracks: [...(f.tracks || []), ...uploaded] }));
    setUploadingTrack(false);
  };

  const removeTrack = (idx) => setForm(f => ({ ...f, tracks: f.tracks.filter((_, i) => i !== idx) }));
  const updateTitle = (idx, title) => setForm(f => ({ ...f, tracks: f.tracks.map((t, i) => i === idx ? { ...t, title } : t) }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      {/* Cover + basic info */}
      <div className="flex gap-3">
        <div
          className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative group"
          onClick={() => coverRef.current?.click()}
        >
          {form.cover_url
            ? <img src={form.cover_url} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1"><Music className="w-7 h-7 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Cover</span></div>
          }
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Album / EP / Single title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
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

      {/* Track playlist upload */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-foreground">Tracks {form.tracks?.length > 0 && `(${form.tracks.length})`}</p>
          <button
            onClick={() => trackRef.current?.click()}
            disabled={uploadingTrack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploadingTrack ? 'Uploading…' : 'Upload Tracks'}
          </button>
        </div>
        {form.tracks?.length > 0 && (
          <div className="bg-secondary/40 rounded-lg px-3 py-1">
            {form.tracks.map((t, i) => (
              <TrackUploadRow key={i} track={t} index={i} onRemove={removeTrack} onTitleChange={updateTitle} />
            ))}
          </div>
        )}
        {form.tracks?.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border rounded-lg">
            Upload audio files to build the tracklist
          </p>
        )}
      </div>

      {/* Streaming links */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground">Streaming Links</p>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Spotify URL" value={form.spotify_url} onChange={e => setForm(f => ({ ...f, spotify_url: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Apple Music URL" value={form.apple_music_url} onChange={e => setForm(f => ({ ...f, apple_music_url: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="SoundCloud URL" value={form.soundcloud_url} onChange={e => setForm(f => ({ ...f, soundcloud_url: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Bandcamp URL" value={form.bandcamp_url} onChange={e => setForm(f => ({ ...f, bandcamp_url: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Other Link" value={form.other_url} onChange={e => setForm(f => ({ ...f, other_url: e.target.value }))} />
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || uploading || uploadingTrack || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadCover(e.target.files[0])} />
      <input ref={trackRef} type="file" accept="audio/*" multiple className="hidden" onChange={e => e.target.files?.length && uploadTracks(e.target.files)} />
    </div>
  );
}

function AlbumCard({ release, index, isOwner, onEdit, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(null);
  const audioRefs = useRef({});

  const streamLinks = [
    { label: 'Spotify', url: release.spotify_url, color: 'bg-green-500' },
    { label: 'Apple', url: release.apple_music_url, color: 'bg-pink-500' },
    { label: 'SoundCloud', url: release.soundcloud_url, color: 'bg-orange-500' },
    { label: 'Bandcamp', url: release.bandcamp_url, color: 'bg-teal-600' },
    { label: 'Listen', url: release.other_url, color: 'bg-primary' },
  ].filter(l => l.url);

  const toggleTrack = (i) => {
    if (playingIdx === i) {
      audioRefs.current[i]?.pause();
      setPlayingIdx(null);
    } else {
      if (playingIdx !== null) audioRefs.current[playingIdx]?.pause();
      audioRefs.current[i]?.play();
      setPlayingIdx(i);
    }
  };

  const tracks = release.tracks || [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Album header */}
      <div className="flex gap-3 p-3">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary flex items-center justify-center cursor-pointer"
          onClick={() => tracks.length > 0 && setExpanded(v => !v)}
        >
          {release.cover_url
            ? <img src={release.cover_url} alt={release.title} className="w-full h-full object-cover" />
            : <Music className="w-6 h-6 text-muted-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{release.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge className={`text-[10px] capitalize ${TYPE_COLORS[release.type]}`}>{release.type}</Badge>
                {release.release_date && <span className="text-xs text-muted-foreground">{format(new Date(release.release_date), 'MMM yyyy')}</span>}
                {tracks.length > 0 && <span className="text-xs text-muted-foreground">{tracks.length} tracks</span>}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => onEdit(index)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onRemove(index)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {streamLinks.map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-medium ${l.color}`}>
                <ExternalLink className="w-2.5 h-2.5" />{l.label}
              </a>
            ))}
            {tracks.length > 0 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                {expanded ? 'Hide' : 'Show'} Tracklist
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tracklist */}
      {expanded && tracks.length > 0 && (
        <div className="border-t border-border bg-secondary/20 px-3 py-2 space-y-0">
          {tracks.map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
              <span className="text-xs text-muted-foreground w-5 text-center flex-shrink-0">{i + 1}</span>
              {t.audio_url && (
                <>
                  <audio
                    ref={el => { if (el) audioRefs.current[i] = el; }}
                    src={t.audio_url}
                    onEnded={() => setPlayingIdx(null)}
                    preload="metadata"
                  />
                  <button
                    onClick={() => toggleTrack(i)}
                    className="w-7 h-7 rounded-full bg-accent flex items-center justify-center flex-shrink-0 hover:bg-accent/80 transition-colors"
                  >
                    {playingIdx === i
                      ? <Pause className="w-3.5 h-3.5 text-accent-foreground" />
                      : <Play className="w-3.5 h-3.5 text-accent-foreground ml-0.5" />
                    }
                  </button>
                </>
              )}
              <span className="text-sm text-foreground flex-1 truncate">{t.title || `Track ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}
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

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Release
          </Button>
        </div>
      )}
      {showForm && <ReleaseForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}

      {releases.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No releases added yet.</p>
      ) : (
        <div className="space-y-3">
          {releases.map((r, i) => (
            editIdx === i
              ? <ReleaseForm key={i} initial={r} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
              : <AlbumCard key={i} release={r} index={i} isOwner={isOwner} onEdit={setEditIdx} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}