import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Layers, ChevronRight, Clock, CheckCircle2, Trash2, Pencil, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import ArtistWorkDetail from './ArtistWorkDetail';

const STATUS_COLORS = {
  active: 'bg-green-500/10 text-green-600',
  completed: 'bg-primary/10 text-primary',
  archived: 'bg-muted text-muted-foreground',
};

function SeriesForm({ artistId, ownerId, series, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: series?.title || '',
    description: series?.description || '',
    year: series?.year || new Date().getFullYear().toString(),
    status: series?.status || 'active',
    is_wip: series?.is_wip || false,
    cover_image: series?.cover_image || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(series?.cover_image || '');
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true);
    let coverImage = form.cover_image;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      coverImage = file_url;
    }
    const data = { ...form, cover_image: coverImage, artist_id: artistId, owner_id: ownerId };
    if (series?.id) {
      await base44.entities.ArtistSeries.update(series.id, data);
    } else {
      await base44.entities.ArtistSeries.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{series ? 'Edit Series' : 'New Series'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <label className="block cursor-pointer">
          <div className="aspect-video rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
            {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> :
              <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Cover image</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Series title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" placeholder="Describe this series…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Year (e.g. 2024)" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
          <select className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_wip} onChange={e => setForm(p => ({ ...p, is_wip: e.target.checked }))} className="rounded" />
          <span className="text-sm text-muted-foreground">Mark as Work In Progress</span>
        </label>

        <Button onClick={handleSave} disabled={!form.title || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (series ? 'Save Changes' : 'Create Series')}
        </Button>
      </motion.div>
    </div>
  );
}

export default function ArtistSeriesTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [selectedSeries, setSelectedSeries] = useState(null);

  const { data: seriesList = [], isLoading } = useQuery({
    queryKey: ['artist-series', artistId],
    queryFn: () => base44.entities.ArtistSeries.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ArtistSeries.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['artist-series', artistId] }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['artist-series', artistId] });
    setShowForm(false);
    setEditingSeries(null);
  };

  if (selectedSeries) {
    return <ArtistWorkDetail series={selectedSeries} isOwner={isOwner} ownerId={ownerId} artistId={artistId} onBack={() => setSelectedSeries(null)} />;
  }

  return (
    <div className="space-y-4">
      {isOwner && (
        <button
          onClick={() => { setEditingSeries(null); setShowForm(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> New Series
        </button>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-16">
          <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No series yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Create your first series to organize your work.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seriesList.map(s => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-xl overflow-hidden border border-border bg-card hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer"
              onClick={() => setSelectedSeries(s)}
            >
              <div className="aspect-video bg-muted overflow-hidden">
                {s.cover_image ? <img src={s.cover_image} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> :
                  <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center"><Layers className="w-8 h-8 text-accent/40" /></div>}
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{s.title}</h3>
                    {s.year && <p className="text-xs text-muted-foreground mt-0.5">{s.year}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {s.is_wip && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]"><Clock className="w-2.5 h-2.5 mr-0.5" />WIP</Badge>}
                    <Badge className={`border-0 text-[10px] ${STATUS_COLORS[s.status]}`}>{s.status}</Badge>
                  </div>
                </div>
                {s.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>}
              </div>
              <div className="absolute inset-0 flex items-center justify-end pr-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <ChevronRight className="w-5 h-5 text-accent" />
              </div>
              {isOwner && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); setEditingSeries(s); setShowForm(true); }}
                    className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete this series?')) deleteMutation.mutate(s.id); }}
                    className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <SeriesForm artistId={artistId} ownerId={ownerId} series={editingSeries}
            onClose={() => { setShowForm(false); setEditingSeries(null); }} onSaved={refresh} />
        )}
      </AnimatePresence>
    </div>
  );
}