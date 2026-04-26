import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Briefcase, CalendarDays, Clock, Plus, Trash2, X, Loader2, Megaphone, CheckCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EventCard from '@/components/shared/EventCard';

function ServiceItem({ service, isOwner, onDelete }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-xl border border-border bg-card group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-sm text-foreground">{service.name}</p>
          {service.duration && <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />{service.duration}</Badge>}
        </div>
        {service.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{service.description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {service.price && <span className="text-sm font-bold text-foreground">{service.price}</span>}
        {isOwner && (
          <button onClick={() => onDelete(service)} className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddServiceModal({ business, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const services = [...(business.hub_data?.services || []), form];
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), services } });
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Service</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Service name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="What's included…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Price (e.g. $75/hr)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Duration (e.g. 60 min)" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
        </div>
        <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Service'}
        </Button>
      </div>
    </div>
  );
}

function AnnounceModal({ business, user, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const handlePost = async () => {
    setSaving(true);
    await base44.entities.Post.create({
      author_id: user.id, author_name: business.name, author_avatar: business.image_url,
      author_type: 'business', page_id: business.id, page_type: 'business',
      content, post_type: 'announcement', visibility: 'public',
      neighborhood_id: business.neighborhood_id, neighborhood_name: business.neighborhood_name,
    });
    setSaving(false); onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Post Update</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
          placeholder={`Updates, availability, promotions from ${business.name}…`}
          value={content} onChange={e => setContent(e.target.value)} />
        <Button onClick={handlePost} disabled={!content || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : <><Megaphone className="w-4 h-4" />Post Update</>}
        </Button>
      </div>
    </div>
  );
}

export default function ServiceHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    setShowAdd(false); setShowAnnounce(false);
  };

  const deleteService = async (service) => {
    if (!window.confirm('Remove this service?')) return;
    const services = (business.hub_data?.services || []).filter(s => s.name !== service.name);
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), services } });
    refresh();
  };

  const services = business.hub_data?.services || [];
  const bookingUrl = business.hub_data?.booking_url;
  const insuranceInfo = business.hub_data?.insurance_info;
  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowAnnounce(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <Megaphone className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Post Update</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Add Service</span>
          </button>
        </div>
      )}

      {bookingUrl && (
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
          <CalendarDays className="w-4 h-4" /> Book an Appointment
        </a>
      )}

      {insuranceInfo && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Insurance & Payment</p>
            <p className="text-xs text-blue-700 mt-0.5">{insuranceInfo}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Briefcase className="w-4 h-4 text-accent" /> Services & Pricing</h2>
          {isOwner && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">
            {isOwner ? 'List your services and pricing here.' : 'No services listed yet.'}
          </p>
        ) : (
          <div className="space-y-2">
            {services.map((s, i) => <ServiceItem key={i} service={s} isOwner={isOwner} onDelete={deleteService} />)}
          </div>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /> Upcoming</h2>
          <div className="space-y-3">{upcomingEvents.slice(0, 3).map(e => <EventCard key={e.id} event={e} compact />)}</div>
        </div>
      )}

      {showAdd && <AddServiceModal business={business} onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {showAnnounce && user && <AnnounceModal business={business} user={user} onClose={() => setShowAnnounce(false)} onSaved={refresh} />}
    </div>
  );
}