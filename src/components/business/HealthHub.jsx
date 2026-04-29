import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, CalendarDays, Shield, Clock, Plus, Trash2, X, Loader2, CheckCircle, Phone } from 'lucide-react';
import BusinessPostsFeed from '@/components/business/BusinessPostsFeed';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EventCard from '@/components/shared/EventCard';

function TreatmentItem({ treatment, isOwner, onDelete }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border bg-card group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-foreground">{treatment.name}</p>
          {treatment.duration && <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />{treatment.duration}</Badge>}
          {treatment.is_new && <Badge className="text-xs bg-green-500/10 text-green-700 border-0">New</Badge>}
        </div>
        {treatment.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{treatment.description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {treatment.price && <span className="text-sm font-bold text-foreground">{treatment.price}</span>}
        {isOwner && (
          <button onClick={() => onDelete(treatment)} className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddTreatmentModal({ business, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', is_new: false });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const treatments = [...(business.hub_data?.treatments || []), form];
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), treatments } });
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Treatment / Service</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Treatment name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Description…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Price (e.g. $120)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Duration (e.g. 45 min)" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_new} onChange={e => setForm(p => ({ ...p, is_new: e.target.checked }))} className="rounded" />
          <span className="text-muted-foreground">Mark as new offering</span>
        </label>
        <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Treatment'}
        </Button>
      </div>
    </div>
  );
}

export default function HealthHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    setShowAdd(false);
  };

  const deleteTreatment = async (treatment) => {
    if (!window.confirm('Remove this treatment?')) return;
    const treatments = (business.hub_data?.treatments || []).filter(t => t.name !== treatment.name);
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), treatments } });
    refresh();
  };

  const treatments = business.hub_data?.treatments || [];
  const bookingUrl = business.hub_data?.booking_url;
  const insuranceAccepted = business.hub_data?.insurance_accepted;
  const telehealthAvailable = business.hub_data?.telehealth_available;
  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => setShowAdd(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Add Treatment</span>
          </button>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-3 flex-wrap">
        {bookingUrl && (
          <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
            <CalendarDays className="w-4 h-4" /> Book Appointment
          </a>
        )}
        {business.phone && (
          <a href={`tel:${business.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border">
            <Phone className="w-4 h-4" /> Call Now
          </a>
        )}
      </div>

      {/* Info Badges */}
      <div className="flex flex-wrap gap-2">
        {telehealthAvailable && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-medium text-green-700">Telehealth Available</span>
          </div>
        )}
        {insuranceAccepted && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Insurance Accepted</span>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Heart className="w-4 h-4 text-accent" /> Treatments & Services</h2>
          {isOwner && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>
        {treatments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">
            {isOwner ? 'Add your treatments and services here.' : 'No services listed yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {treatments.map((t, i) => <TreatmentItem key={i} treatment={t} isOwner={isOwner} onDelete={deleteTreatment} />)}
          </div>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /> Wellness Events</h2>
          <div className="space-y-3">{upcomingEvents.slice(0, 3).map(e => <EventCard key={e.id} event={e} compact />)}</div>
        </div>
      )}

      <BusinessPostsFeed business={business} isOwner={isOwner} user={user} />

      {showAdd && <AddTreatmentModal business={business} onClose={() => setShowAdd(false)} onSaved={refresh} />}
    </div>
  );
}