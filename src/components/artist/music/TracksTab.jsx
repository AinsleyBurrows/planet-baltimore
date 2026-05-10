import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Music, ExternalLink, Play, Pause, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMPTY = { title: '', audio_url: '', cover_url: '', duration: '', stream_url: '' };

function TrackForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef(null);
  const coverRef = useRef(null);

  const uploadFile = async (file, field) => {
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, [field]: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Track Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="flex gap-2">
        <button onClick={() => audioRef.current?.click()} disabled={!!uploading}
          className="flex-1 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-xs transition-colors">
          {uploading === 'audio_url' ? 'Uploading…' : form.audio_url ? '✓ Audio uploaded' : '+ Upload audio file'}
        </button>
        <button onClick={() => coverRef.current?.click()} disabled={!!uploading}
          className="flex-1 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-xs transition-colors">
          {uploading === 'cover_url' ? 'Uploading…' : form.cover_url ? '✓ Cover uploaded' : '+ Upload cover art'}
        </button>
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Duration (e.g. 3:45)" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="External stream link (Spotify, SoundCloud, etc.)" value={form.stream_url} onChange={e => setForm(f => ({ ...f, stream_url: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!!saving || !!uploading || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'audio_url')} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadFile(e.target.files[0], 'cover_url')} />
    </div>
  );
}

function TrackPlayer({ track }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => { setCurrentTime(audio.currentTime); setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0); };
    const onLoad = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoad);
    audio.addEventListener('ended', onEnded);
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('loadedmetadata', onLoad); audio.removeEventListener('ended', onEnded); };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); } else { audio.play(); setPlaying(true); }
  };

  const seek = (e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  const fmt = (s) => { if (!s || isNaN(s)) return '0:00'; const m = Math.floor(s / 60); const sec = Math.floor(s % 60); return `${m}:${sec.toString().padStart(2, '0')}`; };

  return (
    <div className="flex items-center gap-3 mt-2">
      <audio ref={audioRef} src={track.audio_url} preload="metadata" />
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0 hover:bg-accent/90 active:scale-95 transition-all shadow-sm"
      >
        {playing ? <Pause className="w-4 h-4 text-accent-foreground fill-accent-foreground" /> : <Play className="w-4 h-4 text-accent-foreground fill-accent-foreground ml-0.5" />}
      </button>
      <div className="flex-1 space-y-1">
        <div
          className="w-full h-1.5 bg-secondary rounded-full overflow-hidden cursor-pointer"
          onClick={seek}
        >
          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{fmt(currentTime)}</span>
          <span>{track.duration || fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

export default function TracksTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const tracks = artist.tracks || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtistPage.update(artist.id, { tracks: list });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([...tracks, form]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save(tracks.map((t, i) => i === editIdx ? { ...t, ...form } : t)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this track?')) return; await save(tracks.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Track
          </Button>
        </div>
      )}
      {showForm && <TrackForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}

      {tracks.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No tracks added yet.</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((t, i) => (
            editIdx === i
              ? <TrackForm key={i} initial={t} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
              : (
                <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                    {t.cover_url ? <img src={t.cover_url} alt="" className="w-full h-full object-cover" /> : <Music className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{t.title}</p>
                    {t.audio_url
                      ? <TrackPlayer track={t} />
                      : t.duration && <p className="text-xs text-muted-foreground">{t.duration}</p>
                    }
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {t.stream_url && (
                      <a href={t.stream_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-full hover:bg-secondary text-accent transition-colors" title="Stream">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {isOwner && (
                      <>
                        <button onClick={() => setEditIdx(i)} className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(i)} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
          ))}
        </div>
      )}
    </div>
  );
}