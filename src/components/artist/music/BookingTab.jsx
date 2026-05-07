import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, FileText, Loader2, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BookingTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const booking = artist.booking_info || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    manager_name: booking.manager_name || '',
    manager_email: booking.manager_email || '',
    booking_email: booking.booking_email || '',
    booking_phone: booking.booking_phone || '',
    rider_url: booking.rider_url || '',
  });
  const [saving, setSaving] = useState(false);

  // Inquiry form state
  const [inquiry, setInquiry] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const saveInfo = async () => {
    setSaving(true);
    await base44.entities.ArtistPage.update(artist.id, { booking_info: form });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
    setEditing(false);
    setSaving(false);
  };

  const sendInquiry = async () => {
    if (!inquiry.name || !inquiry.email || !inquiry.message) return;
    setSending(true);
    const to = booking.booking_email || booking.manager_email || artist.contact_email;
    if (to) {
      await base44.integrations.Core.SendEmail({
        to,
        subject: `Booking Inquiry: ${inquiry.subject || `Message for ${artist.name}`}`,
        body: `From: ${inquiry.name} <${inquiry.email}>\n\n${inquiry.message}`,
      });
    }
    setSent(true);
    setSending(false);
  };

  return (
    <div className="space-y-5">
      {/* Booking Info Panel */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Booking & Management</h3>
          {isOwner && !editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
        </div>
        {editing ? (
          <>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Manager Name" value={form.manager_name} onChange={e => setForm(f => ({ ...f, manager_name: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Manager Email" value={form.manager_email} onChange={e => setForm(f => ({ ...f, manager_email: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Booking Email" value={form.booking_email} onChange={e => setForm(f => ({ ...f, booking_email: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Booking Phone" value={form.booking_phone} onChange={e => setForm(f => ({ ...f, booking_phone: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Technical Rider URL" value={form.rider_url} onChange={e => setForm(f => ({ ...f, rider_url: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveInfo} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </>
        ) : (
          <div className="space-y-2 text-sm">
            {!booking.manager_name && !booking.booking_email && !booking.booking_phone && (
              <p className="text-muted-foreground">{isOwner ? 'Add your booking info so people can reach you.' : 'No booking info available.'}</p>
            )}
            {booking.manager_name && <p className="text-foreground"><span className="font-medium">Manager:</span> {booking.manager_name}</p>}
            {booking.manager_email && <p><a href={`mailto:${booking.manager_email}`} className="text-accent hover:underline flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{booking.manager_email}</a></p>}
            {booking.booking_email && <p><a href={`mailto:${booking.booking_email}`} className="text-accent hover:underline flex items-center gap-1"><Mail className="w-3.5 h-3.5" />Booking: {booking.booking_email}</a></p>}
            {booking.booking_phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{booking.booking_phone}</p>}
            {booking.rider_url && <a href={booking.rider_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline text-sm"><FileText className="w-3.5 h-3.5" />Technical Rider</a>}
          </div>
        )}
      </div>

      {/* Booking Inquiry Form */}
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
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Subject (event name, date, etc.)" value={inquiry.subject} onChange={e => setInquiry(f => ({ ...f, subject: e.target.value }))} />
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