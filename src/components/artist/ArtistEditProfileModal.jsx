import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useQueryClient, useQuery } from '@tanstack/react-query';

const CATEGORIES = ['visual_art', 'music', 'video', 'photography', 'performance', 'literary', 'mixed_media', 'digital', 'other'];
const SOCIAL_PLATFORMS = ['instagram', 'twitter', 'tiktok', 'youtube', 'soundcloud', 'bandcamp', 'linkedin'];

export default function ArtistEditProfileModal({ artist, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: artist.name || '',
    bio: artist.bio || '',
    category: artist.category || 'visual_art',
    website: artist.website || '',
    contact_email: artist.contact_email || '',
    neighborhood_id: artist.neighborhood_id || '',
    neighborhood_name: artist.neighborhood_name || '',
    tags: (artist.tags || []).join(', '),
    social_links: artist.social_links || {},
  });

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods-list'],
    queryFn: () => base44.entities.Neighborhood.list('name', 100),
  });

  const handleNeighborhoodChange = (id) => {
    const found = neighborhoods.find(n => n.id === id);
    setForm(p => ({ ...p, neighborhood_id: id, neighborhood_name: found?.name || '' }));
  };
  const [saving, setSaving] = useState(false);

  const updateSocial = (platform, value) => {
    setForm(p => ({ ...p, social_links: { ...p.social_links, [platform]: value } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    await base44.entities.ArtistPage.update(artist.id, {
      name: form.name,
      bio: form.bio,
      category: form.category,
      website: form.website,
      contact_email: form.contact_email,
      neighborhood_id: form.neighborhood_id,
      neighborhood_name: form.neighborhood_name,
      tags,
      social_links: form.social_links,
    });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Edit Artist Page</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell people about your art and practice…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Neighborhood</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.neighborhood_id}
                onChange={e => handleNeighborhoodChange(e.target.value)}
              >
                <option value="">Select neighborhood…</option>
                {neighborhoods.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Website</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://…" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Email</label>
              <input type="email" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="studio@…" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="painting, abstract, Baltimore" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Social Links</label>
            <div className="space-y-2">
              {SOCIAL_PLATFORMS.map(p => (
                <div key={p} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground capitalize w-20 flex-shrink-0">{p}</span>
                  <input className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-ring" value={form.social_links[p] || ''} onChange={e => updateSocial(p, e.target.value)} placeholder={`https://${p}.com/…`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
        </Button>
      </motion.div>
    </div>
  );
}