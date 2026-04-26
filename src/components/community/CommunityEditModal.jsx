import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = ['neighborhood', 'arts', 'activism', 'wellness', 'education', 'business', 'social', 'sports', 'faith', 'civic', 'other'];

export default function CommunityEditModal({ community, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: community.name || '',
    description: community.description || '',
    category: community.category || '',
    website: community.website || '',
    contact_email: community.contact_email || '',
    tags: community.tags?.join(', ') || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(community.image_url || '');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(community.banner_url || '');
  const [saving, setSaving] = useState(false);

  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'avatar') { setAvatarFile(file); setAvatarPreview(preview); }
    else { setBannerFile(file); setBannerPreview(preview); }
  };

  const handleSave = async () => {
    setSaving(true);
    let updates = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (avatarFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
      updates.image_url = file_url;
    }
    if (bannerFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: bannerFile });
      updates.banner_url = file_url;
    }
    await base44.entities.Community.update(community.id, updates);
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
    setSaving(false);
    onClose();
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Edit Community Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Banner */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Banner Image</label>
            <label className="block cursor-pointer">
              <div className="aspect-[3/1] rounded-xl overflow-hidden bg-secondary border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
                {bannerPreview
                  ? <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                  : <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Upload banner</span></div>}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'banner')} />
            </label>
          </div>

          {/* Avatar */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Community Logo / Icon</label>
            <label className="block cursor-pointer w-24">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-secondary border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'avatar')} />
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Community Name *</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" value={form.description} onChange={set('description')} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
              <select className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.category} onChange={set('category')}>
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="https://…" value={form.website} onChange={set('website')} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Email</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="contact@example.com" value={form.contact_email} onChange={set('contact_email')} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma-separated)</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="art, culture, family" value={form.tags} onChange={set('tags')} />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}