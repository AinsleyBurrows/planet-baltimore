import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Scissors, Loader2, X, Upload, ExternalLink, Share2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function ClipForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', embed_url: '', thumbnail_url: '', description: '', duration_label: '', source_episode: '' });
  const [uploading, setUploading] = useState(false);
  const thumbRef = useRef(null);
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, thumbnail_url: file_url }));
    setUploading(false);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">{initial ? 'Edit Clip' : 'Add Clip'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
          <input required className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Best moment from Ep. 12" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Embed URL (YouTube / Vimeo) *</label>
          <input required className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.embed_url} onChange={e => setForm(p => ({ ...p, embed_url: e.target.value }))} placeholder="https://youtube.com/shorts/…" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.duration_label} onChange={e => setForm(p => ({ ...p, duration_label: e.target.value }))} placeholder="0:45" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Source Episode</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.source_episode} onChange={e => setForm(p => ({ ...p, source_episode: e.target.value }))} placeholder="Ep. 12 — Guests" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Thumbnail</label>
          <div className="flex gap-2 items-center">
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} placeholder="URL or upload" />
            <button type="button" onClick={() => thumbRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input bg-secondary text-sm hover:bg-secondary/80 flex-shrink-0">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}Upload
            </button>
            <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
          </div>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none min-h-[60px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button type="submit" size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" />Save</Button>
      </div>
    </form>
  );
}

function toEmbed(url) {
  // Convert YouTube watch / shorts URLs to embed format
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function ClipCard({ clip, isOwner, onEdit, onDelete, artistName }) {
  const [copied, setCopied] = useState(false);
  const share = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clip.embed_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden group">
      <div className="relative aspect-video bg-secondary">
        {clip.embed_url ? (
          <iframe src={toEmbed(clip.embed_url)} title={clip.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : clip.thumbnail_url ? (
          <img src={clip.thumbnail_url} alt={clip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Scissors className="w-6 h-6 text-muted-foreground" /></div>
        )}
        {clip.duration_label && <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-medium">{clip.duration_label}</span>}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground leading-snug truncate">{clip.title}</p>
            {clip.source_episode && <p className="text-xs text-muted-foreground mt-0.5 truncate">{clip.source_episode}</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={share} title="Copy link" className="p-1.5 rounded-lg text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
            {isOwner && (
              <>
                <button onClick={onEdit} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        </div>
        {clip.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{clip.description}</p>}
      </div>
    </div>
  );
}

export default function ClipsTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const clips = artist.podcast_clips || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });

  const save = async (form) => {
    setSaving(true);
    if (editing != null) {
      const updated = clips.map((c, i) => i === editing ? form : c);
      await base44.entities.ArtistPage.update(artist.id, { podcast_clips: updated });
      setEditing(null);
    } else {
      await base44.entities.ArtistPage.update(artist.id, { podcast_clips: [form, ...clips] });
      setShowForm(false);
    }
    setSaving(false); refresh();
  };

  const del = async (idx) => {
    if (!window.confirm('Remove this clip?')) return;
    const updated = clips.filter((_, i) => i !== idx);
    await base44.entities.ArtistPage.update(artist.id, { podcast_clips: updated });
    refresh();
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <button onClick={() => setShowForm(true)} className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />Add Clip
        </button>
      )}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ClipForm onSave={save} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>
      {clips.length === 0 && !showForm
        ? <div className="text-center py-12"><div className="w-14 h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3"><Scissors className="w-6 h-6 text-accent" /></div><p className="text-sm text-muted-foreground">No clips yet.</p></div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{clips.map((c, i) => editing === i ? <ClipForm key={i} initial={c} onSave={save} onCancel={() => setEditing(null)} /> : <ClipCard key={i} clip={c} isOwner={isOwner} onEdit={() => setEditing(i)} onDelete={() => del(i)} artistName={artist.name} />)}</div>}
    </div>
  );
}