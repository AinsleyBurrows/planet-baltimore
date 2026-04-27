import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Camera, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const CATEGORIES = ['music','art','community','nightlife','food','wellness','education','activism','family','sports','networking','festival','other'];

export default function CommunityCreateEventModal({ community, user, event, onClose }) {
  const queryClient = useQueryClient();
  const imageInputRef = useRef(null);
  const isEditing = !!event;

  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : '',
    end_date: event?.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
    venue_name: event?.venue_name || '',
    address: event?.address || '',
    category: event?.category || 'community',
    is_free: event?.is_free ?? true,
    allow_donations: event?.allow_donations || false,
    tags: (event?.tags || []).join(', '),
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(event?.image_url || '');
  const [saving, setSaving] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);

    let image_url = event?.image_url || '';
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = file_url;
    }

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      description: form.description,
      date: new Date(form.date).toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      venue_name: form.venue_name,
      address: form.address,
      category: form.category,
      is_free: form.is_free,
      allow_donations: form.allow_donations,
      tags,
      image_url,
      community_id: community.id,
      neighborhood_name: community.neighborhood_name || '',
      neighborhood_id: community.neighborhood_id || '',
    };

    if (isEditing) {
      await base44.entities.Event.update(event.id, payload);
    } else {
      await base44.entities.Event.create({
        ...payload,
        organizer_id: user.id,
        organizer_name: community.name,
        organizer_avatar: community.image_url || '',
        visibility: 'public',
        status: 'upcoming',
      });
    }

    queryClient.invalidateQueries({ queryKey: ['community-events', community.id] });
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">{isEditing ? 'Edit Event' : `New Event — ${community.name}`}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>

          <div className="overflow-y-auto flex-1 p-5 space-y-4">
            {/* Image */}
            <div
              className="relative h-32 rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer flex items-center justify-center"
              onClick={() => imageInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add event image</span>
                </div>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Event Title *</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Event details..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Start Date & Time *</label>
                <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">End Date & Time</label>
                <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Venue Name</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.venue_name} onChange={e => setForm(p => ({ ...p, venue_name: e.target.value }))} placeholder="Venue name" />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Address</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <select className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pricing</label>
                <select className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.is_free ? 'free' : 'paid'} onChange={e => setForm(p => ({ ...p, is_free: e.target.value === 'free' }))}>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="music, free, outdoor" />
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.allow_donations} onChange={e => setForm(p => ({ ...p, allow_donations: e.target.checked }))} className="rounded" />
              <span className="text-muted-foreground">Allow donations</span>
            </label>
          </div>

          <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
            <Button onClick={handleSave} disabled={!form.title || !form.date || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{isEditing ? 'Saving…' : 'Creating…'}</> : isEditing ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}