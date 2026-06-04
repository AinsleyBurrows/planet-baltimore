import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Mic, ExternalLink, Trash2, X, Loader2, Share2, Check, Copy, Pin, Upload } from 'lucide-react';
import FeaturedEpisode from './FeaturedEpisode';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function EpisodeForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    title: '', description: '', episode_number: '', season_number: '',
    audio_url: '', cover_url: '', duration: '', published_at: '',
    spotify_url: '', apple_url: '', youtube_url: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const audioInputRef = useRef(null);

  const handleAudioUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, audio_url: file_url }));
    setUploadedFileName(file.name);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      episode_number: form.episode_number ? Number(form.episode_number) : undefined,
      season_number: form.season_number ? Number(form.season_number) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Add Episode</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
          <input required className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Episode title" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Episode #</label>
          <input type="number" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.episode_number} onChange={e => setForm(p => ({ ...p, episode_number: e.target.value }))} placeholder="1" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="45 min" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What's this episode about?" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Published Date</label>
          <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.published_at} onChange={e => setForm(p => ({ ...p, published_at: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Audio File</label>
          <div className="flex gap-2 items-center">
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={uploadedFileName || form.audio_url} onChange={e => { setForm(p => ({ ...p, audio_url: e.target.value })); setUploadedFileName(''); }} placeholder="Paste URL or upload file…" />
            <button type="button" onClick={() => audioInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input bg-secondary text-sm font-medium hover:bg-secondary/80 transition-colors flex-shrink-0 disabled:opacity-50">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && handleAudioUpload(e.target.files[0])} />
          </div>
          {uploadedFileName && <p className="text-xs text-green-600 mt-1">✓ Uploaded: {uploadedFileName}</p>}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Spotify URL</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.spotify_url} onChange={e => setForm(p => ({ ...p, spotify_url: e.target.value }))} placeholder="https://open.spotify.com/…" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Apple Podcasts URL</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.apple_url} onChange={e => setForm(p => ({ ...p, apple_url: e.target.value }))} placeholder="https://podcasts.apple.com/…" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Save
        </Button>
      </div>
    </form>
  );
}

function EpisodeSharePopover({ episode, artistName, onClose }) {
  const [copied, setCopied] = useState(false);
  const episodeUrl = episode.spotify_url || episode.apple_url || episode.youtube_url || window.location.href;
  const text = encodeURIComponent(`🎙️ Listening to "${episode.title}" by ${artistName} — check it out!`);
  const url = encodeURIComponent(episodeUrl);

  const copyLink = () => {
    navigator.clipboard.writeText(episodeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const socials = [
    { label: 'Twitter / X', emoji: '🐦', href: `https://twitter.com/intent/tweet?text=${text}&url=${url}` },
    { label: 'Facebook', emoji: '📘', href: `https://www.facebook.com/sharer/sharer.php?u=${url}` },
    { label: 'WhatsApp', emoji: '💬', href: `https://api.whatsapp.com/send?text=${text}%20${url}` },
  ];

  return (
    <div className="absolute right-0 top-8 z-20 w-52 bg-card border border-border rounded-xl shadow-lg p-3 space-y-2" onClick={e => e.stopPropagation()}>
      <p className="text-xs font-semibold text-foreground mb-1">Share this episode</p>
      {socials.map(s => (
        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors">
          <span>{s.emoji}</span>{s.label}
        </a>
      ))}
      <button onClick={copyLink}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-secondary text-sm text-foreground transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded hover:bg-secondary text-muted-foreground">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function PodcastEpisodesTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingIdx, setDeletingIdx] = useState(null);
  const [sharingIdx, setSharingIdx] = useState(null);

  const episodes = artist.podcast_episodes || [];
  const links = artist.podcast_links || {};

  const handleSave = async (episode) => {
    setSaving(true);
    const updated = [episode, ...episodes];
    await base44.entities.ArtistPage.update(artist.id, { podcast_episodes: updated });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    setSaving(false);
    setShowForm(false);
  };

  const handleDelete = async (idx) => {
    setDeletingIdx(idx);
    const updated = episodes.filter((_, i) => i !== idx);
    await base44.entities.ArtistPage.update(artist.id, { podcast_episodes: updated });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    setDeletingIdx(null);
  };

  const handlePin = async (idx) => {
    const updated = episodes.map((ep, i) => ({ ...ep, is_featured: i === idx }));
    await base44.entities.ArtistPage.update(artist.id, { podcast_episodes: updated });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const platforms = [
    { key: 'spotify', label: 'Spotify', emoji: '🎧' },
    { key: 'apple_podcasts', label: 'Apple Podcasts', emoji: '🎙️' },
    { key: 'youtube', label: 'YouTube', emoji: '▶️' },
    { key: 'rss', label: 'RSS Feed', emoji: '📡' },
    { key: 'amazon_music', label: 'Amazon Music', emoji: '🎵' },
  ].filter(p => links[p.key]);

  return (
    <div className="space-y-4">
      {/* Featured Episode */}
      <FeaturedEpisode artist={artist} isOwner={isOwner} />

      {/* Platform links */}
      {platforms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {platforms.map(p => (
            <a key={p.key} href={links[p.key]} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
              <span>{p.emoji}</span> {p.label}
            </a>
          ))}
        </div>
      )}

      {isOwner && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />Add Episode
        </button>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <EpisodeForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />
          </motion.div>
        )}
      </AnimatePresence>

      {episodes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-14 h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3">
            <Mic className="w-6 h-6 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground">No episodes yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {episodes.map((ep, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 group relative">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 font-bold text-accent text-sm">
                {ep.episode_number || <Mic className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground leading-snug">{ep.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {ep.duration && <span>{ep.duration}</span>}
                      {ep.published_at && <span>{new Date(ep.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="relative">
                      <button onClick={() => setSharingIdx(sharingIdx === idx ? null : idx)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      {sharingIdx === idx && (
                        <EpisodeSharePopover episode={ep} artistName={artist.name} onClose={() => setSharingIdx(null)} />
                      )}
                    </div>
                    {isOwner && (
                      <>
                        <button onClick={() => handlePin(idx)} title={ep.is_featured ? 'Pinned as featured' : 'Pin as featured episode'}
                          className={`p-1.5 rounded-lg transition-colors ${ep.is_featured ? 'text-accent' : 'text-muted-foreground hover:text-accent hover:bg-accent/10 opacity-0 group-hover:opacity-100'}`}>
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(idx)} disabled={deletingIdx === idx}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100">
                          {deletingIdx === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {ep.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{ep.description}</p>}
                {ep.audio_url && (
                  <audio controls className="w-full mt-2 h-8" style={{ height: '32px' }}>
                    <source src={ep.audio_url} />
                  </audio>
                )}
                <div className="flex gap-2 mt-2">
                  {ep.spotify_url && <a href={ep.spotify_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-0.5">🎧 Spotify <ExternalLink className="w-3 h-3" /></a>}
                  {ep.apple_url && <a href={ep.apple_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-0.5">🎙️ Apple <ExternalLink className="w-3 h-3" /></a>}
                  {ep.youtube_url && <a href={ep.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-0.5">▶️ YouTube <ExternalLink className="w-3 h-3" /></a>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}