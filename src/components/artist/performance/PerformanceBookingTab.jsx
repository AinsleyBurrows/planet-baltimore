import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, FileText, DollarSign, Clock, MapPin, Lightbulb, Volume2, Users, Ruler, Upload, Loader2, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const RIDER_FIELDS = [
  { key: 'stage_dimensions', label: 'Stage Dimensions', icon: Ruler, placeholder: 'e.g. 20×20 ft minimum' },
  { key: 'lighting_needs', label: 'Lighting Needs', icon: Lightbulb, placeholder: 'e.g. Full stage wash + 2 spotlights' },
  { key: 'sound_needs', label: 'Sound / PA', icon: Volume2, placeholder: 'e.g. 2 vocal mics, DI, monitors' },
  { key: 'crew_requirements', label: 'Crew Requirements', icon: Users, placeholder: 'e.g. 1 stagehand + 1 sound tech' },
  { key: 'setup_time', label: 'Setup / Soundcheck', icon: Clock, placeholder: 'e.g. 90 minutes' },
];

function BookingForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || { manager_name: '', manager_email: '', booking_email: '', booking_phone: '', fee_range: '', availability: '', regions_toured: '', stage_dimensions: '', lighting_needs: '', sound_needs: '', crew_requirements: '', setup_time: '', rider_url: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const uploadRider = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, rider_url: file_url }));
    setUploading(false);
  };

  const field = (key, ph) => (
    <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Booking Contact</p>
        <div className="space-y-2">
          {field('manager_name', 'Manager / Contact Name')}
          {field('manager_email', 'Manager Email')}
          {field('booking_email', 'Booking Email')}
          {field('booking_phone', 'Booking Phone')}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Availability & Fees</p>
        <div className="space-y-2">
          {field('fee_range', 'Fee Range (e.g. $500–$2000)')}
          {field('availability', 'Availability Notes')}
          {field('regions_toured', 'Regions Toured / Willing to Travel')}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Technical Rider</p>
        <div className="space-y-2">
          {RIDER_FIELDS.map(f => (
            <div key={f.key} className="flex items-center gap-2">
              <f.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="mt-2">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors disabled:opacity-50">
            <Upload className="w-3.5 h-3.5" />{uploading ? 'Uploading…' : form.rider_url ? 'Replace Rider File' : 'Upload Rider PDF'}
          </button>
          {form.rider_url && <p className="text-xs text-accent mt-1 truncate">📎 {form.rider_url.split('/').pop()}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files[0] && uploadRider(e.target.files[0])} />
    </div>
  );
}

export default function PerformanceBookingTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const artistId = artist.id;
  const { data: booking, isLoading } = useQuery({
    queryKey: ['performance-booking', artistId],
    queryFn: async () => {
      const list = await base44.entities.PerformanceBooking.filter({ artist_id: artistId }, '-created_date', 1);
      return list[0] || null;
    },
    enabled: !!artistId,
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inquiry, setInquiry] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['performance-booking', artistId] });

  const save = async (form) => {
    setSaving(true);
    if (booking) await base44.entities.PerformanceBooking.update(booking.id, form);
    else await base44.entities.PerformanceBooking.create({ ...form, artist_id: artistId });
    setSaving(false); setEditing(false); refresh();
  };

  const sendInquiry = async () => {
    if (!inquiry.name || !inquiry.email || !inquiry.message) return;
    setSending(true);
    const to = booking?.booking_email || booking?.manager_email || artist.contact_email;
    if (to) {
      await base44.integrations.Core.SendEmail({
        to,
        subject: `Booking Inquiry: ${inquiry.subject || `Message for ${artist.name}`}`,
        body: `From: ${inquiry.name} <${inquiry.email}>\n\n${inquiry.message}`,
      });
    }
    setSent(true); setSending(false);
  };

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;
  if (isOwner && (!booking || editing)) {
    return <BookingForm initial={booking} onSave={save} onCancel={() => setEditing(false)} saving={saving} />;
  }

  const hasContact = booking && (booking.manager_name || booking.manager_email || booking.booking_email || booking.booking_phone);
  const hasRider = booking && (booking.stage_dimensions || booking.lighting_needs || booking.sound_needs || booking.crew_requirements || booking.setup_time || booking.rider_url);

  return (
    <div className="space-y-5">
      {/* Booking Contact */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Booking & Management</h3>
          {isOwner && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
        </div>
        {!hasContact
          ? <p className="text-sm text-muted-foreground">{isOwner ? 'Add your booking info so presenters can reach you.' : 'No booking info available.'}</p>
          : <div className="space-y-2 text-sm">
              {booking.manager_name && <p className="text-foreground"><span className="font-medium">Manager:</span> {booking.manager_name}</p>}
              {booking.manager_email && <a href={`mailto:${booking.manager_email}`} className="text-accent hover:underline flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{booking.manager_email}</a>}
              {booking.booking_email && <a href={`mailto:${booking.booking_email}`} className="text-accent hover:underline flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Booking: {booking.booking_email}</a>}
              {booking.booking_phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{booking.booking_phone}</p>}
              {booking.fee_range && <p className="flex items-center gap-1 text-muted-foreground"><DollarSign className="w-3.5 h-3.5" />{booking.fee_range}</p>}
              {booking.availability && <p className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3.5 h-3.5" />{booking.availability}</p>}
              {booking.regions_toured && <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{booking.regions_toured}</p>}
            </div>}
      </div>

      {/* Technical Rider */}
      {hasRider && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Technical Rider</h3>
          <div className="space-y-2 text-sm">
            {RIDER_FIELDS.map(f => booking[f.key] && (
              <p key={f.key} className="flex items-start gap-2 text-muted-foreground"><f.icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-accent" /><span><span className="font-medium text-foreground">{f.label}:</span> {booking[f.key]}</span></p>
            ))}
          </div>
          {booking.rider_url && <a href={booking.rider_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline text-sm"><FileText className="w-3.5 h-3.5" />Download Full Rider</a>}
        </div>
      )}

      {/* Inquiry Form */}
      {!isOwner && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Send a Booking Inquiry</h3>
          {sent ? (
            <div className="flex flex-col items-center py-6 gap-2 text-green-600">
              <CheckCircle className="w-8 h-8" />
              <p className="text-sm font-medium">Inquiry sent!</p>
              <p className="text-xs text-muted-foreground">We'll get back to you as soon as possible.</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Your Name *" value={inquiry.name} onChange={e => setInquiry(f => ({ ...f, name: e.target.value }))} />
                <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Your Email *" value={inquiry.email} onChange={e => setInquiry(f => ({ ...f, email: e.target.value }))} />
              </div>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Subject (event, date, venue)" value={inquiry.subject} onChange={e => setInquiry(f => ({ ...f, subject: e.target.value }))} />
              <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-28" placeholder="Tell them about the event, venue, budget, etc. *" value={inquiry.message} onChange={e => setInquiry(f => ({ ...f, message: e.target.value }))} />
              <Button onClick={sendInquiry} disabled={sending || !inquiry.name || !inquiry.email || !inquiry.message} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</> : <><Send className="w-4 h-4 mr-2" />Send Inquiry</>}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}