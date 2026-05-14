import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Loader2, Trash2, Bell, Calendar, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isFuture } from 'date-fns';

function DropForm({ artistId, ownerId, drop, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: drop?.title || '',
    description: drop?.description || '',
    drop_date: drop?.drop_date || '',
    collection_name: drop?.collection_name || '',
    preview_image: drop?.preview_image || '',
    notify_followers: drop?.notify_followers ?? true,
    limited: drop?.limited ?? false,
    quantity: drop?.quantity || '',
    link: drop?.link || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(drop?.preview_image || '');
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true);
    let previewImage = form.preview_image;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      previewImage = file_url;
    }
    const data = { ...form, preview_image: previewImage, artist_id: artistId, owner_id: ownerId, type: 'drop' };
    if (drop?.id) {
      await base44.entities.StudioUpdate.update(drop.id, data);
    } else {
      await base44.entities.StudioUpdate.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{drop ? 'Edit Drop' : 'Announce a Drop'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <label className="block cursor-pointer">
          <div className="aspect-video rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
            {imagePreview
              ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              : <div className="text-center"><Zap className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Drop preview image</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Drop name *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[70px]" placeholder="Tell your community what's dropping…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Drop Date & Time</label>
            <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.drop_date} onChange={e => setForm(p => ({ ...p, drop_date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Collection</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g. Ancestral Thread" value={form.collection_name} onChange={e => setForm(p => ({ ...p, collection_name: e.target.value }))} />
          </div>
        </div>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Shop / purchase link (optional)" value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} />

        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.limited} onChange={e => setForm(p => ({ ...p, limited: e.target.checked }))} className="rounded" />
            <span className="text-sm text-muted-foreground">Limited quantity drop</span>
          </label>
          {form.limited && (
            <input className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="How many pieces?" type="number" value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
          )}
        </div>

        <Button onClick={handleSave} disabled={!form.title || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (drop ? 'Save Changes' : 'Announce Drop')}
        </Button>
      </motion.div>
    </div>
  );
}

export default function DropsTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDrop, setEditingDrop] = useState(null);

  const { data: drops = [], isLoading } = useQuery({
    queryKey: ['drops', artistId],
    queryFn: () => base44.entities.StudioUpdate.filter({ artist_id: artistId, type: 'drop' }, '-created_date', 30),
    enabled: !!artistId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StudioUpdate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drops', artistId] }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['drops', artistId] });
    setShowForm(false);
    setEditingDrop(null);
  };

  const upcoming = drops.filter(d => d.drop_date && isFuture(new Date(d.drop_date)));
  const past = drops.filter(d => !d.drop_date || isPast(new Date(d.drop_date)));

  const DropCard = ({ drop }) => {
    const isUpcoming = drop.drop_date && isFuture(new Date(drop.drop_date));
    return (
      <motion.div key={drop.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="group relative rounded-xl overflow-hidden border border-border bg-card hover:shadow-md transition-all">
        {drop.preview_image && (
          <div className="aspect-video overflow-hidden">
            <img src={drop.preview_image} alt={drop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground text-sm">{drop.title}</h3>
            <div className="flex gap-1.5 flex-shrink-0">
              {isUpcoming && <Badge className="bg-green-500/10 text-green-600 border-0 text-[10px]"><Zap className="w-2.5 h-2.5 mr-0.5" />Upcoming</Badge>}
              {drop.limited && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">Limited</Badge>}
            </div>
          </div>
          {drop.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{drop.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {drop.drop_date && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(drop.drop_date), 'MMM d, yyyy · h:mm a')}</span>
            )}
            {drop.collection_name && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{drop.collection_name}</span>}
          </div>
          {drop.link && (
            <a href={drop.link} target="_blank" rel="noopener noreferrer"
              className="mt-3 w-full flex items-center justify-center py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-80 transition-opacity">
              Shop the Drop →
            </a>
          )}
        </div>
        {isOwner && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditingDrop(drop); setShowForm(true); }}
              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 text-xs">Edit</button>
            <button onClick={() => { if (window.confirm('Delete this drop?')) deleteMutation.mutate(drop.id); }}
              className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-5">
      {isOwner && (
        <button
          onClick={() => { setEditingDrop(null); setShowForm(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Announce a Drop
        </button>
      )}

      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : drops.length === 0 ? (
        <div className="text-center py-16">
          <Zap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No drops announced yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Announce your next collection drop to build hype with your followers.</p>}
        </div>
      ) : (
        <div className="space-y-5">
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" />Upcoming Drops</p>
              <div className="space-y-4">{upcoming.map(d => <DropCard key={d.id} drop={d} />)}</div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              {upcoming.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Drops</p>}
              <div className="space-y-4">{past.map(d => <DropCard key={d.id} drop={d} />)}</div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <DropForm artistId={artistId} ownerId={ownerId} drop={editingDrop}
            onClose={() => { setShowForm(false); setEditingDrop(null); }} onSaved={refresh} />
        )}
      </AnimatePresence>
    </div>
  );
}