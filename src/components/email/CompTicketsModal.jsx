import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { X, Loader2, Ticket, Users, Mail, Gift, UserPlus } from 'lucide-react';

const parseEmails = (text) => {
  const set = new Set();
  text.split(/[\s,;]+/).forEach(tok => {
    const e = tok.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) set.add(e);
  });
  return Array.from(set);
};

export default function CompTicketsModal({ onClose }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [eventId, setEventId] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [selected, setSelected] = useState([]);
  const [manualText, setManualText] = useState('');
  const [notify, setNotify] = useState(true);
  const [sending, setSending] = useState(false);
  const [creatingType, setCreatingType] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['user-events', user?.id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: user.id }, '-date', 50),
    enabled: !!user?.id,
  });

  const { data: ticketTypes = [], refetch: refetchTypes } = useQuery({
    queryKey: ['event-ticket-types', eventId],
    queryFn: () => base44.entities.TicketType.filter({ event_id: eventId }, 'sort_order', 100),
    enabled: !!eventId,
  });

  const { data: attendees = [], isLoading: loadingAtt } = useQuery({
    queryKey: ['event-comp-attendees', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const [rsvps, orders] = await Promise.all([
        base44.entities.RSVP.filter({ event_id: eventId, status: 'going' }, '-created_date', 500).catch(() => []),
        base44.entities.TicketOrder.filter({ event_id: eventId, payment_status: 'completed' }, '-created_date', 500).catch(() => []),
      ]);
      const map = new Map();
      rsvps.forEach(r => { if (r.user_id) map.set(r.user_id, { user_id: r.user_id, name: r.attendee_name || '', email: (r.attendee_email || '').toLowerCase() }); });
      orders.forEach(o => { if (o.buyer_id && !map.has(o.buyer_id)) map.set(o.buyer_id, { user_id: o.buyer_id, name: o.buyer_name || '', email: (o.buyer_email || '').toLowerCase() }); });
      return Array.from(map.values());
    },
    enabled: !!eventId,
  });

  const attendeeEmails = useMemo(() => new Set(attendees.map(a => a.email).filter(Boolean)), [attendees]);
  const manualEmails = useMemo(() => parseEmails(manualText).filter(e => !attendeeEmails.has(e)), [manualText, attendeeEmails]);
  const totalRecipients = selected.length + manualEmails.length;

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(attendees.map(a => a.user_id));
  const clearAll = () => setSelected([]);

  const createCompType = async () => {
    setCreatingType(true);
    try {
      await base44.entities.TicketType.create({
        event_id: eventId, name: 'Complimentary Admission', price: 0, quantity_total: 9999, is_active: true, ticket_type_group: 'free', sort_order: 99,
      });
      await refetchTypes();
      toast({ title: 'Complimentary ticket type created' });
    } catch (e) {
      toast({ title: 'Could not create ticket type', description: e.message, variant: 'destructive' });
    } finally { setCreatingType(false); }
  };

  const issue = async () => {
    if (!eventId || !ticketTypeId) { toast({ title: 'Pick an event and ticket type', variant: 'destructive' }); return; }
    if (totalRecipients === 0) { toast({ title: 'Add at least one recipient', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const selectedAttendees = attendees.filter(a => selected.includes(a.user_id)).map(a => ({ user_id: a.user_id, email: a.email, name: a.name }));
      const manual = manualEmails.map(e => ({ email: e }));
      const recipients = [...selectedAttendees, ...manual];
      const res = await base44.functions.invoke('issueCompTickets', { event_id: eventId, ticket_type_id: ticketTypeId, recipients, notify });
      const data = res.data || {};
      qc.invalidateQueries({ queryKey: ['email-campaigns'] });
      const issued = data.issued || 0;
      const unresolved = data.unresolved || [];
      if (unresolved.length > 0) {
        toast({
          title: `${issued} comp${issued === 1 ? '' : 's'} issued`,
          description: `${unresolved.length} not matched to a Planet Baltimore account: ${unresolved.map(u => u.email).join(', ')}`,
          variant: 'destructive',
        });
      } else {
        toast({ title: `${issued} complimentary ticket${issued === 1 ? '' : 's'} issued`, description: notify ? `Tickets delivered to each account${data.emailed ? ` · ${data.emailed} emailed` : ''}.` : 'Tickets added to each account.' });
      }
      onClose();
    } catch (e) {
      toast({ title: 'Could not issue tickets', description: e.message, variant: 'destructive' });
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3" onClick={onClose}>
      <div className="bg-card rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <p className="font-semibold text-foreground flex items-center gap-2"><Gift className="w-4 h-4 text-[#d4580a]" /> Send Complimentary Tickets</p>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Event</label>
            <select value={eventId} onChange={e => { setEventId(e.target.value); setTicketTypeId(''); setSelected([]); setManualText(''); }} className="w-full mt-1 h-10 rounded-lg bg-secondary/50 border-0 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="">Select an event…</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          </div>

          {eventId && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Ticket type to comp</label>
              {ticketTypes.length > 0 ? (
                <select value={ticketTypeId} onChange={e => setTicketTypeId(e.target.value)} className="w-full mt-1 h-10 rounded-lg bg-secondary/50 border-0 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="">Select a ticket type…</option>
                  {ticketTypes.map(t => <option key={t.id} value={t.id}>{t.name} {t.price ? `($${t.price})` : '(Free)'}</option>)}
                </select>
              ) : (
                <div className="mt-1 flex items-center justify-between gap-2 p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">No ticket types for this event yet.</p>
                  <Button size="sm" onClick={createCompType} disabled={creatingType} variant="outline" className="h-8">{creatingType ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Complimentary type'}</Button>
                </div>
              )}
            </div>
          )}

          {eventId && ticketTypeId && (
            <>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Event attendees</p>
                  <div className="flex gap-2 text-xs">
                    <button onClick={selectAll} className="text-[#d4580a] font-medium hover:underline">Select all</button>
                    <button onClick={clearAll} className="text-muted-foreground hover:underline">Clear</button>
                  </div>
                </div>
                {loadingAtt ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                : attendees.length === 0 ? <p className="text-xs text-muted-foreground py-3">No attendees have RSVP'd to this event yet.</p>
                : (
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {attendees.map(a => {
                      const on = selected.includes(a.user_id);
                      return (
                        <label key={a.user_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                          <input type="checkbox" checked={on} onChange={() => toggle(a.user_id)} className="w-4 h-4 accent-[#d4580a]" />
                          <span className="text-sm text-foreground flex-1 truncate">{a.name || a.email || 'Attendee'}</span>
                          {a.email && <span className="text-xs text-muted-foreground truncate">{a.email}</span>}
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">{selected.length} attendee{selected.length === 1 ? '' : 's'} selected</p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5"><UserPlus className="w-3.5 h-3.5" /> Add by email or Planet Baltimore address</p>
                <p className="text-xs text-muted-foreground mb-2">Type one or more emails (the address they use on Planet Baltimore). Separate with commas or new lines.</p>
                <textarea value={manualText} onChange={e => setManualText(e.target.value)} rows={3} placeholder={'friend@example.com, another@example.com'} className="w-full p-3 rounded-xl bg-secondary/50 border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none" />
                {manualEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {manualEmails.map(e => (
                      <span key={e} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-[#d4580a]/10 text-[#d4580a] border border-[#d4580a]/30">
                        {e}
                        <button type="button" onClick={() => setManualText(prev => prev.split(/[\s,;]+/).filter(t => t.trim().toLowerCase() !== e).join(', '))} className="p-0.5 rounded-full hover:bg-[#d4580a]/20"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Recipients are matched to existing Planet Baltimore accounts. Unmatched addresses will be skipped.</p>
              </div>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} className="w-4 h-4 accent-[#d4580a]" />
                <span className="text-sm text-foreground flex-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email each recipient their comp ticket</span>
              </label>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 p-4 border-t border-border">
          <Button onClick={issue} disabled={sending || totalRecipients === 0} className="ml-auto text-white flex items-center gap-1.5" style={{ backgroundColor: '#d4580a' }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />} Issue {totalRecipients} comp{totalRecipients === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </div>
  );
}