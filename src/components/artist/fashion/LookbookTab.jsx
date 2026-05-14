import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Image as ImageIcon, X, Loader2, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

function LookForm({ artistId, ownerId, look, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: look?.title || '',
    description: look?.description || '',
    season: look?.season || '',
    collection: look?.collection || '',
    image_url: look?.image_url || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(look?.image_url || '');
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true);
    let imageUrl = form.image_url;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }
    const data = { ...form, image_url: imageUrl, artist_id: artistId, owner_id: ownerId };
    if (look?.id) {
      await base44.entities.ArtistWork.update(look.id, { ...data, work_type: 'lookbook' });
    } else {
      await base44.entities.ArtistWork.create({ ...data, work_type: 'lookbook' });
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
          <h3 className="font-semibold text-foreground">{look ? 'Edit Look' : 'Add Look'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <label className="block cursor-pointer">
          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
            {imagePreview
              ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              : <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Photo</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Look title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[60px]" placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Season (e.g. SS26)" value={form.season} onChange={e => setForm(p => ({ ...p, season: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Collection name" value={form.collection} onChange={e => setForm(p => ({ ...p, collection: e.target.value }))} />
        </div>

        <Button onClick={handleSave} disabled={!form.title || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : (look ? 'Save Changes' : 'Add to Lookbook')}
        </Button>
      </motion.div>
    </div>
  );
}

export default function LookbookTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingLook, setEditingLook] = useState(null);
  const [activeCollection, setActiveCollection] = useState('all');

  const { data: looks = [], isLoading } = useQuery({
    queryKey: ['lookbook', artistId],
    queryFn: () => base44.entities.ArtistWork.filter({ artist_id: artistId, work_type: 'lookbook' }, '-created_date', 50),
    enabled: !!artistId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ArtistWork.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lookbook', artistId] }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['lookbook', artistId] });
    setShowForm(false);
    setEditingLook(null);
  };

  const collections = ['all', ...new Set(looks.map(l => l.collection).filter(Boolean))];
  const filtered = activeCollection === 'all' ? looks : looks.filter(l => l.collection === activeCollection);

  return (
    <div className="space-y-4">
      {isOwner && (
        <button
          onClick={() => { setEditingLook(null); setShowForm(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Look
        </button>
      )}

      {collections.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {collections.map(c => (
            <button
              key={c}
              onClick={() => setActiveCollection(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${activeCollection === c ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {c === 'all' ? 'All Looks' : c}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ImageIcon className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No looks yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Add your first look to build your lookbook.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(look => (
            <motion.div key={look.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="group relative rounded-xl overflow-hidden bg-muted aspect-[3/4]">
              {look.image_url
                ? <img src={look.image_url} alt={look.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                : <div className="w-full h-full bg-gradient-to-br from-accent/10 to-primary/5 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-accent/30" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-semibold line-clamp-1">{look.title}</p>
                {(look.season || look.collection) && (
                  <p className="text-white/70 text-[10px] mt-0.5">{[look.season, look.collection].filter(Boolean).join(' · ')}</p>
                )}
              </div>
              {isOwner && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingLook(look); setShowForm(true); }}
                    className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"><Tag className="w-3 h-3" /></button>
                  <button onClick={() => { if (window.confirm('Remove this look?')) deleteMutation.mutate(look.id); }}
                    className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <LookForm artistId={artistId} ownerId={ownerId} look={editingLook}
            onClose={() => { setShowForm(false); setEditingLook(null); }} onSaved={refresh} />
        )}
      </AnimatePresence>
    </div>
  );
}