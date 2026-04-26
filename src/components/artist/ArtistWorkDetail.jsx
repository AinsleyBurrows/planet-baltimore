import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Trash2, Pencil, X, Loader2, Image as ImageIcon, Clock, DollarSign, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

function WorkForm({ series, artistId, ownerId, work, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: work?.title || '',
    description: work?.description || '',
    medium: work?.medium || '',
    dimensions: work?.dimensions || '',
    year: work?.year || new Date().getFullYear().toString(),
    is_wip: work?.is_wip || false,
    is_available: work?.is_available || false,
    price: work?.price || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(work?.image_url || '');
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true);
    let imageUrl = work?.image_url || '';
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }
    const data = { ...form, image_url: imageUrl, series_id: series.id, artist_id: artistId, owner_id: ownerId, price: form.price ? parseFloat(form.price) : undefined };
    if (work?.id) {
      await base44.entities.ArtistWork.update(work.id, data);
    } else {
      await base44.entities.ArtistWork.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{work ? 'Edit Work' : 'Add Work'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <label className="block cursor-pointer">
          <div className="aspect-square rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center max-h-64">
            {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> :
              <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Upload image</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Work title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" placeholder="Process notes, story, or description…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Medium (e.g. Oil on canvas)" value={form.medium} onChange={e => setForm(p => ({ ...p, medium: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Dimensions (e.g. 24×36 in)" value={form.dimensions} onChange={e => setForm(p => ({ ...p, dimensions: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Year" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
          <input type="number" className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Price (optional)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_wip} onChange={e => setForm(p => ({ ...p, is_wip: e.target.checked }))} className="rounded" />
            <span className="text-sm text-muted-foreground">Work In Progress</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_available} onChange={e => setForm(p => ({ ...p, is_available: e.target.checked }))} className="rounded" />
            <span className="text-sm text-muted-foreground">Available for sale</span>
          </label>
        </div>

        <Button onClick={handleSave} disabled={!form.title || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (work ? 'Save Changes' : 'Add Work')}
        </Button>
      </motion.div>
    </div>
  );
}

export default function ArtistWorkDetail({ series, isOwner, ownerId, artistId, onBack }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [lightboxWork, setLightboxWork] = useState(null);

  const { data: works = [] } = useQuery({
    queryKey: ['artist-works', series.id],
    queryFn: () => base44.entities.ArtistWork.filter({ series_id: series.id }, 'sort_order', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ArtistWork.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['artist-works', series.id] }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['artist-works', series.id] });
    setShowForm(false);
    setEditingWork(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-secondary transition-colors flex-shrink-0"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-foreground truncate">{series.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            {series.year && <span className="text-xs text-muted-foreground">{series.year}</span>}
            {series.is_wip && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]"><Clock className="w-2.5 h-2.5 mr-0.5" />WIP</Badge>}
          </div>
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => { setEditingWork(null); setShowForm(true); }} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-1">
            <Plus className="w-3.5 h-3.5" />Add Work
          </Button>
        )}
      </div>

      {series.description && <p className="text-sm text-muted-foreground">{series.description}</p>}

      {/* Works grid */}
      {works.length === 0 ? (
        <div className="text-center py-14 text-muted-foreground text-sm">
          No works yet in this series.
          {isOwner && <p className="text-xs mt-1">Click "Add Work" to start building this series.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {works.map(work => (
            <motion.div key={work.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="group relative rounded-xl overflow-hidden border border-border bg-card cursor-pointer hover:shadow-md transition-all"
              onClick={() => setLightboxWork(work)}
            >
              <div className="aspect-square bg-muted overflow-hidden">
                {work.image_url ? <img src={work.image_url} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> :
                  <div className="w-full h-full bg-gradient-to-br from-accent/10 to-primary/5 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground/40" /></div>}
              </div>
              <div className="p-2">
                <p className="text-xs font-semibold text-foreground truncate">{work.title}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {work.is_wip && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[9px] px-1">WIP</Badge>}
                  {work.is_available && <Badge className="bg-green-500/10 text-green-600 border-0 text-[9px] px-1">For Sale</Badge>}
                </div>
              </div>
              {isOwner && (
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); setEditingWork(work); setShowForm(true); }}
                    className="p-1 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete this work?')) deleteMutation.mutate(work.id); }}
                    className="p-1 rounded-md bg-black/60 text-white hover:bg-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Work Lightbox */}
      <AnimatePresence>
        {lightboxWork && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxWork(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="relative max-w-2xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col sm:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setLightboxWork(null)} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"><X className="w-4 h-4" /></button>
              {lightboxWork.image_url && (
                <div className="sm:w-1/2 bg-black flex-shrink-0">
                  <img src={lightboxWork.image_url} alt={lightboxWork.title} className="w-full h-full object-contain max-h-[50vh] sm:max-h-[90vh]" />
                </div>
              )}
              <div className="p-5 flex-1 overflow-y-auto space-y-3">
                <h2 className="font-bold text-foreground text-lg">{lightboxWork.title}</h2>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {lightboxWork.year && <p>📅 {lightboxWork.year}</p>}
                  {lightboxWork.medium && <p className="flex items-center gap-1.5"><span>🎨</span>{lightboxWork.medium}</p>}
                  {lightboxWork.dimensions && <p className="flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" />{lightboxWork.dimensions}</p>}
                  {lightboxWork.price && lightboxWork.is_available && <p className="flex items-center gap-1.5 text-green-600 font-medium"><DollarSign className="w-3.5 h-3.5" />{lightboxWork.price.toLocaleString()} — Available</p>}
                </div>
                {lightboxWork.description && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">About this work</p>
                    <p className="text-sm text-foreground leading-relaxed">{lightboxWork.description}</p>
                  </div>
                )}
                <div className="flex gap-1.5 flex-wrap">
                  {lightboxWork.is_wip && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs"><Clock className="w-3 h-3 mr-1" />Work In Progress</Badge>}
                  {lightboxWork.is_available && <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">For Sale</Badge>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && <WorkForm series={series} artistId={artistId} ownerId={ownerId} work={editingWork}
          onClose={() => { setShowForm(false); setEditingWork(null); }} onSaved={refresh} />}
      </AnimatePresence>
    </div>
  );
}