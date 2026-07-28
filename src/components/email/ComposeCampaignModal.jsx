import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, Users, Mail, Eye } from 'lucide-react';

export default function ComposeCampaignModal({ onClose }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [fromName, setFromName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [listIds, setListIds] = useState([]);
  const [eventId, setEventId] = useState('');
  const [includeAttendees, setIncludeAttendees] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: lists = [] } = useQuery({
    queryKey: ['email-lists', user?.id],
    queryFn: () => base44.entities.EmailList.filter({ owner_id: user.id }, '-created_date', 100),
    enabled: !!user?.id,
  });
  const { data: events = [] } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: user.id }, '-date', 50),
    enabled: !!user?.id,
  });
  const { data: eventAttendees = 0 } = useQuery({
    queryKey: ['event-attendee-count', eventId],
    queryFn: async () => {
      if (!eventId) return 0;
      const [rsvps, orders] = await Promise.all([
        base44.entities.RSVP.filter({ event_id: eventId, status: 'going' }, '-created_date', 500).catch(() => []),
        base44.entities.TicketOrder.filter({ event_id: eventId, payment_status: 'completed' }, '-created_date', 500).catch(() => []),
      ]);
      const emails = new Set();
      rsvps.forEach(r => r.attendee_email && emails.add(r.attendee_email.toLowerCase()));
      orders.forEach(o => o.buyer_email && emails.add(o.buyer_email.toLowerCase()));
      return emails.size;
    },
    enabled: !!eventId && includeAttendees,
  });

  const listRecipientCount = useMemo(() => lists.filter(l => listIds.includes(l.id)).reduce((s, l) => s + (l.contact_count || 0), 0), [lists, listIds]);
  const estimatedRecipients = listRecipientCount + (includeAttendees ? eventAttendees : 0);

  const toggleList = (id) => setListIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const send = async () => {
    if (!subject.trim() || !body.trim()) { toast({ title: 'Subject and message are required', variant: 'destructive' }); return; }
    if (listIds.length === 0 && !includeAttendees) { toast({ title: 'Select at least one audience', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const campaign = await base44.entities.EmailCampaign.create({
        owner_id: user.id, event_id: eventId || undefined, from_name: fromName.trim() || 'Planet Baltimore',
        subject: subject.trim(), body: body.trim(), list_ids: listIds, include_event_attendees: includeAttendees, status: 'draft',
      });
      const res = await base44.functions.invoke('sendEmailCampaign', { campaign_id: campaign.id, app_url: window.location.origin });
      const data = res.data || {};
      qc.invalidateQueries({ queryKey: ['email-campaigns', user?.id] });
      if (data.status === 'not_configured') {
        toast({ title: 'Email sending not configured yet', description: 'Add your Resend API key and from address in app secrets to start sending.', variant: 'destructive' });
      } else {
        toast({ title: `Sent ${data.sent || 0} ${data.sent === 1 ? 'email' : 'emails'}`, description: data.failed ? `${data.failed} failed — try again later.` : 'Your invitations are on their way.' });
        onClose();
      }
    } catch (e) {
      toast({ title: 'Send failed', description: e.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <p className="font-semibold text-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-[#d4580a]" /> New Invitation Campaign</p>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-muted-foreground">From name</label><Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Planet Baltimore" className="mt-1" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground">Link to event (optional)</label>
              <select value={eventId} onChange={e => setEventId(e.target.value)} className="w-full mt-1 h-10 rounded-lg bg-secondary/50 border-0 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">None</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
            </div>
          </div>
          <div><label className="text-xs font-semibold text-muted-foreground">Subject</label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="You're invited to…" className="mt-1" /></div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Write your invitation. The email will include a button linking to your event's RSVP / ticket page." className="w-full mt-1 p-3 rounded-xl bg-secondary/50 border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Audience</p>
            <div className="space-y-1">
              {lists.length === 0 && <p className="text-xs text-muted-foreground">No lists yet — create some in the Lists tab first.</p>}
              {lists.map(l => (
                <label key={l.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <input type="checkbox" checked={listIds.includes(l.id)} onChange={() => toggleList(l.id)} className="w-4 h-4 accent-[#d4580a]" />
                  <span className="text-sm text-foreground flex-1 truncate">{l.name}</span>
                  <span className="text-xs text-muted-foreground">{l.contact_count || 0}</span>
                </label>
              ))}
              {eventId && (
                <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                  <input type="checkbox" checked={includeAttendees} onChange={() => setIncludeAttendees(!includeAttendees)} className="w-4 h-4 accent-[#d4580a]" />
                  <span className="text-sm text-foreground flex-1">This event's attendees (RSVPs + ticket buyers)</span>
                  <span className="text-xs text-muted-foreground">{includeAttendees ? eventAttendees : '—'}</span>
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Estimated recipients: <span className="font-semibold text-foreground">{estimatedRecipients}</span></p>
          </div>

          {showPreview && (
            <div className="border border-border rounded-xl p-4 bg-secondary/30">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Preview</p>
              <p className="text-sm font-semibold text-foreground">{subject || '(subject)'}</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap mt-1">{body}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 p-4 border-t border-border">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> Preview</Button>
          <Button onClick={send} disabled={sending} className="ml-auto text-white flex items-center gap-1.5" style={{ backgroundColor: '#d4580a' }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to {estimatedRecipients} recipients
          </Button>
        </div>
      </div>
    </div>
  );
}