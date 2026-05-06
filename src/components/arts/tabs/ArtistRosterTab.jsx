import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Users, Globe, Camera, X, Upload, ImageIcon, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// ── Portfolio Modal ──────────────────────────────────────────────
function PortfolioModal({ artist, artistIdx, org, isOwner, onClose }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const portfolio = artist.portfolio || [];

  const uploadPhoto = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const roster = [...(org.artist_roster || [])];
    roster[artistIdx] = { ...roster[artistIdx], portfolio: [...portfolio, { url: file_url, caption: '' }] };
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: roster });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setUploading(false);
  };

  const removePhoto = async (photoIdx) => {
    const roster = [...(org.artist_roster || [])];
    const newPortfolio = portfolio.filter((_, i) => i !== photoIdx);
    roster[artistIdx] = { ...roster[artistIdx], portfolio: newPortfolio };
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: roster });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const updateCaption = async (photoIdx, caption) => {
    const roster = [...(org.artist_roster || [])];
    const newPortfolio = portfolio.map((p, i) => i === photoIdx ? { ...p, caption } : p);
    roster[artistIdx] = { ...roster[artistIdx], portfolio: newPortfolio };
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: roster });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full sm:max-w-2xl bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div>
              <h2 className="font-semibold text-foreground">{artist.name}'s Portfolio</h2>
              <p className="text-xs text-muted-foreground">{portfolio.length} photo{portfolio.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {isOwner && (
              <div className="mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading…' : 'Upload Photo'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
              </div>
            )}

            {portfolio.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No portfolio photos yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {portfolio.map((photo, i) => (
                  <div key={i} className="group relative">
                    <div className="aspect-square rounded-xl overflow-hidden bg-secondary">
                      <img src={photo.url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {isOwner ? (
                      <input
                        className="w-full mt-1 text-xs px-2 py-1 rounded-md border border-input bg-background text-muted-foreground"
                        placeholder="Add caption…"
                        defaultValue={photo.caption || ''}
                        onBlur={e => updateCaption(i, e.target.value)}
                      />
                    ) : (
                      photo.caption && <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Add / Edit Artist Form ───────────────────────────────────────
function ArtistForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { name: '', bio: '', image_url: '', website: '' });
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadPhoto = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Photo upload */}
      <div className="flex items-center gap-3">
        <div
          className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer border border-border hover:border-accent transition-colors relative"
          onClick={() => fileInputRef.current?.click()}
        >
          {form.image_url ? (
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-6 h-6 text-muted-foreground" />
          )}
          {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Artist Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Website / Portfolio URL (optional)" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Short bio" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || uploading || !form.name} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function ArtistRosterTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const roster = org.artist_roster || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [portfolioArtist, setPortfolioArtist] = useState(null); // { artist, idx }

  const saveNew = async (form) => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: [...roster, form] });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setSaving(false);
  };

  const saveEdit = async (form) => {
    setSaving(true);
    const updated = roster.map((a, i) => i === editIdx ? { ...a, ...form } : a);
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setEditIdx(null);
    setSaving(false);
  };

  const remove = async (idx) => {
    if (!window.confirm('Remove this artist?')) return;
    await base44.entities.ArtsOrganization.update(org.id, { artist_roster: roster.filter((_, i) => i !== idx) });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Artist
          </Button>
        </div>
      )}

      {showForm && (
        <ArtistForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />
      )}

      {roster.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No artists listed yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roster.map((artist, i) => (
            <div key={i}>
              {editIdx === i ? (
                <ArtistForm initial={artist} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
              ) : (
                <div className="flex gap-3 p-4 bg-card border border-border rounded-xl">
                  <div
                    className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden bg-accent/10 flex items-center justify-center cursor-pointer"
                    onClick={() => setPortfolioArtist({ artist, idx: i })}
                    title="View portfolio"
                  >
                    {artist.image_url ? (
                      <img src={artist.image_url} alt={artist.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-accent font-bold text-lg">{artist.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-semibold text-foreground truncate">{artist.name}</p>
                      {isOwner && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setEditIdx(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    {artist.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{artist.bio}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      {artist.website && (
                        <a href={artist.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                          <Globe className="w-3 h-3" />Website
                        </a>
                      )}
                      <button
                        onClick={() => setPortfolioArtist({ artist, idx: i })}
                        className="flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Portfolio {artist.portfolio?.length ? `(${artist.portfolio.length})` : ''}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {portfolioArtist && (
        <PortfolioModal
          artist={roster[portfolioArtist.idx] || portfolioArtist.artist}
          artistIdx={portfolioArtist.idx}
          org={org}
          isOwner={isOwner}
          onClose={() => setPortfolioArtist(null)}
        />
      )}
    </div>
  );
}