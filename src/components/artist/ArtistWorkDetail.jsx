import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Plus, Trash2, Pencil, X, Loader2, Image as ImageIcon, Clock, DollarSign, Ruler, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

function WorkForm({ series, artistId, ownerId, work, onClose, onSaved }) {
  // Merge legacy image_url into image_urls array
  const existingImages = work?.image_urls?.length ? work.image_urls : (work?.image_url ? [work.image_url] : []);

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
  const [imagePreviews, setImagePreviews] = useState(existingImages);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (idx) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    // Track which are new files (appended after existingImages)
    const newFileStartIdx = existingImages.length - (existingImages.length - imagePreviews.filter((_, i) => i < existingImages.length).length);
    if (idx >= existingImages.length) {
      setNewFiles(prev => prev.filter((_, i) => i !== (idx - existingImages.length)));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Upload any new files
    const uploadedUrls = await Promise.all(newFiles.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    // Rebuild full list: kept existing + new uploads
    const keptExisting = imagePreviews.filter(p => !p.startsWith('blob:'));
    const allImages = [...keptExisting, ...uploadedUrls];
    const data = {
      ...form,
      image_urls: allImages,
      image_url: allImages[0] || '',
      series_id: series.id,
      artist_id: artistId,
      owner_id: ownerId,
      price: form.price ? parseFloat(form.price) : undefined,
    };
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

        {/* Multi-image upload area */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Images</label>
          <div className="grid grid-cols-3 gap-2">
            {imagePreviews.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-secondary/50 border border-border">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent/50 transition-colors flex flex-col items-center justify-center cursor-pointer bg-secondary/30">
              <ImageIcon className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-[10px] text-muted-foreground">Add</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
            </label>
          </div>
        </div>

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
  const [lightboxImgIdx, setLightboxImgIdx] = useState(0);

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
              onClick={() => { setLightboxWork(work); setLightboxImgIdx(0); }}
            >
              <div className="aspect-square bg-muted overflow-hidden relative">
                {(() => {
                  const thumb = work.image_urls?.[0] || work.image_url;
                  const count = work.image_urls?.length || (work.image_url ? 1 : 0);
                  return thumb ? (
                    <>
                      <img src={thumb} alt={work.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {count > 1 && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold">+{count}</span>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-accent/10 to-primary/5 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground/40" /></div>
                  );
                })()}
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
        {lightboxWork && (() => {
          const allImgs = lightboxWork.image_urls?.length ? lightboxWork.image_urls : (lightboxWork.image_url ? [lightboxWork.image_url] : []);
          const currentImg = allImgs[lightboxImgIdx];
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxWork(null)}>
              <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                className="relative max-w-2xl w-full bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col sm:flex-row max-h-[90vh]"
                onClick={e => e.stopPropagation()}>
                <button onClick={() => setLightboxWork(null)} className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"><X className="w-4 h-4" /></button>
                {allImgs.length > 0 && (
                  <div className="sm:w-1/2 bg-black flex-shrink-0 relative flex items-center justify-center">
                    <img src={currentImg} alt={lightboxWork.title} className="w-full object-contain max-h-[50vh] sm:max-h-[90vh]" />
                    {allImgs.length > 1 && (
                      <>
                        <button disabled={lightboxImgIdx === 0} onClick={() => setLightboxImgIdx(i => i - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button disabled={lightboxImgIdx === allImgs.length - 1} onClick={() => setLightboxImgIdx(i => i + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {allImgs.map((_, i) => (
                            <button key={i} onClick={() => setLightboxImgIdx(i)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${i === lightboxImgIdx ? 'bg-white w-3' : 'bg-white/40'}`} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                <div className="p-5 flex-1 overflow-y-auto space-y-3">
                  <h2 className="font-bold text-foreground text-lg">{lightboxWork.title}</h2>
                  {allImgs.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {allImgs.map((img, i) => (
                        <button key={i} onClick={() => setLightboxImgIdx(i)}
                          className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxImgIdx ? 'border-accent' : 'border-transparent'}`}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
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
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && <WorkForm series={series} artistId={artistId} ownerId={ownerId} work={editingWork}
          onClose={() => { setShowForm(false); setEditingWork(null); }} onSaved={refresh} />}
      </AnimatePresence>
    </div>
  );
}