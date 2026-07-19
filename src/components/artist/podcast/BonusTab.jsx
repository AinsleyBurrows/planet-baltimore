import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Lock, Loader2, X, Upload, Mic, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

function BonusForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', description: '', audio_url: '', duration: '', published_at: '', cover_url: '', tier_name: '', is_locked: true });
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef(null);
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, audio_url: file_url }));
    setUploading(false);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, is_locked: form.is_locked !== false }); }} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">{initial ? 'Edit Bonus' : 'Add Bonus Episode'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
          <input required className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none min-h-[60px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Audio File</label>
          <div className="flex gap-2 items-center">
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.audio_url} onChange={e => setForm(p => ({ ...p, audio_url: e.target.value }))} placeholder="URL or upload" />
            <button type="button" onClick={() => audioRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input bg-secondary text-sm hover:bg-secondary/80 flex-shrink-0">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}Upload
            </button>
            <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="32 min" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Published</label>
          <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.published_at} onChange={e => setForm(p => ({ ...p, published_at: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Tier Name</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.tier_name} onChange={e => setForm(p => ({ ...p, tier_name: e.target.value }))} placeholder="e.g. Inner Circle, Patron" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button type="submit" size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" />Save</Button>
      </div>
    </form>
  );
}

export default function BonusTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const bonus = artist.podcast_bonus_episodes || [];
  const { data: tiers = [] } = useQuery({
    queryKey: ['membership-tiers', artist.id],
    queryFn: () => base44.entities.MembershipTier.filter({ artist_id: artist.id }, 'sort_order', 20),
    enabled: !!artist.id,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });

  const save = async (form) => {
    setSaving(true);
    if (editing != null) {
      const updated = bonus.map((b, i) => i === editing ? form : b);
      await base44.entities.ArtistPage.update(artist.id, { podcast_bonus_episodes: updated });
      setEditing(null);
    } else {
      await base44.entities.ArtistPage.update(artist.id, { podcast_bonus_episodes: [form, ...bonus] });
      setShowForm(false);
    }
    setSaving(false); refresh();
  };

  const del = async (idx) => {
    if (!window.confirm('Remove this bonus episode?')) return;
    const updated = bonus.filter((_, i) => i !== idx);
    await base44.entities.ArtistPage.update(artist.id, { podcast_bonus_episodes: updated });
    refresh();
  };

  return (
    <div className="space-y-4">
      {tiers.length > 0 && (
        <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 rounded-xl p-4">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Crown className="w-4 h-4 text-gold" /> Support the show</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">Become a member to unlock exclusive bonus episodes, uncut interviews, and extended cuts.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {tiers.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-lg p-3" style={t.accent_color ? { borderColor: t.accent_color + '60' } : undefined}>
                <p className="font-semibold text-sm text-foreground">{t.name}</p>
                <p className="text-sm font-bold text-accent">${t.price}<span className="text-xs text-muted-foreground font-normal">/{t.billing_period === 'yearly' ? 'yr' : 'mo'}</span></p>
                {t.perks?.length > 0 && <ul className="mt-1.5 space-y-0.5">{t.perks.slice(0, 3).map((p, i) => <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1"><span className="text-accent">•</span>{p}</li>)}</ul>}
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner && !showForm && editing === null && (
        <button onClick={() => setShowForm(true)} className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />Add Bonus Episode
        </button>
      )}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <BonusForm onSave={save} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {bonus.length === 0 && !showForm
        ? <div className="text-center py-12"><div className="w-14 h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3"><Lock className="w-6 h-6 text-accent" /></div><p className="text-sm text-muted-foreground">No bonus episodes yet.</p></div>
        : <div className="space-y-3">{bonus.map((b, i) => editing === i ? <BonusForm key={i} initial={b} onSave={save} onCancel={() => setEditing(null)} /> : (
          <div key={i} className="bg-card border border-border rounded-xl p-4 relative group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0">{b.cover_url ? <img src={b.cover_url} alt="" className="w-full h-full object-cover rounded-lg" /> : <Mic className="w-4 h-4 text-gold" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm text-foreground truncate">{b.title}</p>
                  {b.tier_name && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />{b.tier_name}</span>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {b.duration && <span>{b.duration}</span>}
                  {b.published_at && <span>{new Date(b.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                </div>
                {b.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{b.description}</p>}
                {b.audio_url && (
                  <div className="relative mt-2">
                    <audio controls className="w-full h-8" style={{ height: '32px' }}><source src={b.audio_url} /></audio>
                  </div>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditing(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          </div>
        ))}</div>}
    </div>
  );
}