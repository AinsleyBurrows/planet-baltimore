import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Calendar, Ticket, ExternalLink, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from '@/components/shared/EventCard';
import { motion, AnimatePresence } from 'framer-motion';
import { isFuture } from 'date-fns';
import { Link } from 'react-router-dom';

const EVENT_CATEGORIES = ['music', 'art', 'community', 'nightlife', 'food', 'wellness', 'education', 'activism', 'family', 'sports', 'networking', 'festival', 'other'];

function CreateEventModal({ pageName, pageImageUrl, neighborhoodId, neighborhoodName, user, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', description: '', date: '', end_date: '',
    venue_name: '', address: '', category: 'art',
    ticketing_mode: 'rsvp_only', is_free: true, capacity: '',
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
    if (!form.title || !form.date) return;
    setSaving(true);
    let image_url = '';
    if (imageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
    }
    const newEvent = await base44.entities.Event.create({
      ...form,
      image_url,
      organizer_id: user.id,
      organizer_name: pageName,
      organizer_avatar: pageImageUrl || '',
      neighborhood_id: neighborhoodId || '',
      neighborhood_name: neighborhoodName || '',
      capacity: form.capacity ? parseInt(form.capacity) : undefined,
      status: 'upcoming',
    });
    setSaving(false);
    onSaved(newEvent);
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
            {imagePreview
              ? <img src={imagePreview} alt="" className="w-full h-full object-cover" />
              : <div className="text-center"><ImageIcon className="w-6 h-6 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Event flyer</span></div>}
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

        <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize" value={form.category} onChange={e => update('category', e.target.value)}>
          {EVENT_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
            <input type="checkbox" checked={form.is_free} onChange={e => update('is_free', e.target.checked)} className="rounded" />
            <span className="text-muted-foreground">Free event</span>
          </label>
          <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.ticketing_mode} onChange={e => update('ticketing_mode', e.target.value)}>
            <option value="rsvp_only">RSVP only</option>
            <option value="platform">Sell tickets</option>
          </select>
          <input type="number" className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Capacity" value={form.capacity} onChange={e => update('capacity', e.target.value)} />
        </div>

        {form.ticketing_mode === 'platform' && (
          <div className="flex items-start gap-2 p-3 bg-accent/10 rounded-lg text-xs text-accent">
            <Ticket className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>After creating the event, go to <strong>Organizer Studio</strong> to set up ticket types, prices, and manage sales.</span>
          </div>
        )}

        <Button onClick={handleSave} disabled={!form.title || !form.date || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</> : 'Create Event'}
        </Button>
      </motion.div>
    </div>
  );
}

/**
 * Reusable events tab for any page type (artist, arts org, business, association, community).
 *
 * Props:
 *   events        – pre-fetched events array (pass empty [] if none)
 *   isOwner       – boolean
 *   user          – current user object
 *   pageName      – display name of the page (for organizer_name)
 *   pageImageUrl  – avatar/image of the page
 *   neighborhoodId / neighborhoodName  – for the event
 *   onCreated     – callback after event is created (to refresh parent query)
 */
export default function PageEventsTab({ events = [], isOwner, user, pageName, pageImageUrl, neighborhoodId, neighborhoodName, onCreated }) {
  const [showCreate, setShowCreate] = useState(false);

  const upcoming = events.filter(e => e.date && isFuture(new Date(e.date))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past     = events.filter(e => e.date && !isFuture(new Date(e.date))).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSaved = (newEvent) => {
    setShowCreate(false);
    onCreated?.(newEvent);
  };

  return (
    <div className="space-y-5">
      {/* Owner actions */}
      {isOwner && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
          <Link
            to="/organizer-studio"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-sm font-medium transition-colors"
          >
            <Ticket className="w-4 h-4" /> Manage Tickets in Studio
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Past</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {past.slice(0, 6).map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No events yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Create your first event above — then add tickets in the Organizer Studio.</p>}
        </div>
      )}

      <AnimatePresence>
        {showCreate && user && (
          <CreateEventModal
            pageName={pageName}
            pageImageUrl={pageImageUrl}
            neighborhoodId={neighborhoodId}
            neighborhoodName={neighborhoodName}
            user={user}
            onClose={() => setShowCreate(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}