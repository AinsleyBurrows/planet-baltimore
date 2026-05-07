import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMPTY = { title: '', embed_url: '', thumbnail_url: '' };

function getEmbedUrl(url) {
  if (!url) return '';
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url; // already an embed URL
}

function VideoForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Video Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="YouTube or Vimeo URL *" value={form.embed_url} onChange={e => setForm(f => ({ ...f, embed_url: e.target.value }))} />
      <p className="text-xs text-muted-foreground">Paste a YouTube or Vimeo link — it will be embedded automatically.</p>
      {form.embed_url && getEmbedUrl(form.embed_url) && (
        <div className="aspect-video rounded-lg overflow-hidden bg-secondary">
          <iframe src={getEmbedUrl(form.embed_url)} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
        </div>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...form, embed_url: getEmbedUrl(form.embed_url) })} disabled={saving || !form.title || !form.embed_url} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function MusicVideosTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const videos = artist.music_videos || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtistPage.update(artist.id, { music_videos: list });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([form, ...videos]); setShowForm(false); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this video?')) return; await save(videos.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Video
          </Button>
        </div>
      )}
      {showForm && <VideoForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}

      {videos.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No music videos added yet.
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((v, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-secondary">
                {v.embed_url
                  ? <iframe src={v.embed_url} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
                  : <div className="w-full h-full flex items-center justify-center"><Video className="w-10 h-10 text-muted-foreground opacity-30" /></div>
                }
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="font-medium text-sm text-foreground">{v.title}</p>
                {isOwner && (
                  <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}