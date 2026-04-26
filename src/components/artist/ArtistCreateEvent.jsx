import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Loader2, Image as ImageIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { format, isFuture } from 'date-fns';
import EventCard from '@/components/shared/EventCard';

const eventCategories = ['music', 'art', 'community', 'nightlife', 'food', 'wellness', 'education', 'activism', 'family', 'sports', 'networking', 'festival', 'other'];

function EventFormModal({ artist, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', description: '', date: '', end_date: '',
    venue_name: '', address: '', category: 'art', capacity: '',
    ticketing_mode: 'rsvp_only', is_free: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true);
    let imageUrl = '';
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }
    await base44.entities.Event.create({
      ...form,
      image_url: imageUrl,
      organizer_id: user.id,
      organizer_name: artist.name,
      organizer_avatar: artist.image_url,
      neighborhood_id: artist.neighborhood_id,
      neighborhood_name: artist.neighborhood_name,
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      status: 'upcoming',
    });
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
          <h3 className="font-semibold text-foreground">Create Event</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <label className="block cursor-pointer">
          <div className="aspect-video rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
            {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> :
              <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Event flyer</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Event title *" value={form.title} onChange={e => update('title', e.target.value)} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" placeholder="Describe the event…" value={form.description} onChange={e => update('description', e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Start *</p>
            <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.date} onChange={e => update('date', e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">End</p>
            <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.end_date} onChange={e => update('end_date', e.target.value)} />
          </div>
        </div>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Venue name" value={form.venue_name} onChange={e => update('venue_name', e.target.value)} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Address" value={form.address} onChange={e => update('address', e.target.value)} />

        <select className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize" value={form.category} onChange={e => update('category', e.target.value)}>
          {eventCategories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.is_free} onChange={e => update('is_free', e.target.checked)} className="rounded" />
            <span className="text-muted-foreground">Free event</span>
          </label>
          <input type="number" className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Capacity (optional)" value={form.capacity} onChange={e => update('capacity', e.target.value)} />
        </div>

        <Button onClick={handleSave} disabled={!form.title || !form.date || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : 'Create Event'}
        </Button>
      </motion.div>
    </div>
  );
}

export default function ArtistCreateEvent({ artist, events = [], isOwner, user }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const upcomingEvents = events.filter(e => e.date && isFuture(new Date(e.date))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const pastEvents = events.filter(e => e.date && !isFuture(new Date(e.date))).sort((a, b) => new Date(b.date) - new Date(a.date));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['artist-events', artist.id] });
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {isOwner && (
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 text-sm text-muted-foreground hover:text-accent transition-colors">
          <Plus className="w-4 h-4" /> Create an event
        </button>
      )}

      {upcomingEvents.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
          {upcomingEvents.map(e => <EventCard key={e.id} event={e} compact />)}
        </div>
      )}

      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past Events</p>
          {pastEvents.slice(0, 5).map(e => <EventCard key={e.id} event={e} compact />)}
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No events yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Create your first event directly from your artist page.</p>}
        </div>
      )}

      <AnimatePresence>
        {showForm && artist && user && (
          <EventFormModal artist={artist} user={user} onClose={() => setShowForm(false)} onSaved={refresh} />
        )}
      </AnimatePresence>
    </div>
  );
}