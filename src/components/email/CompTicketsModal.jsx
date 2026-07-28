import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { X, Loader2, Ticket, Users, Mail, Gift } from 'lucide-react';

export default function CompTicketsModal({ onClose }) {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [eventId, setEventId] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [selected, setSelected] = useState([]);
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
      rsvps.forEach(r => { if (r.user_id) map.set(r.user_id, { user_id: r.user_id, name: r.attendee_name || '', email: r.attendee_email || '' }); });
      orders.forEach(o => { if (o.buyer_id && !map.has(o.buyer_id)) map.set(o.buyer_id, { user_id: o.buyer_id, name: o.buyer_name || '', email: o.buyer_email || '' }); });
      return Array.from(map.values());
    },
    enabled: !!eventId,
  });

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
    if (selected.length === 0) { toast({ title: 'Select at least one attendee', variant: 'destructive' }); return; }
    setSending(true);
    try {
      const recipients = attendees.filter(a => selected.includes(a.user_id));
      const orderNo = `COMP-${Date.now().toString(36).toUpperCase()}`;
      const order = await base44.entities.TicketOrder.create({
        event_id: eventId, ticket_type_id: ticketTypeId,
        buyer_id: user.id, buyer_email: user.email, buyer_name: user.full_name || 'Organizer',
        quantity: recipients.length, subtotal: 0, taxes: 0, platform_fee: 0, discount_applied: 0, total_amount: 0,
        payment_status: 'completed', order_number: orderNo,
      });
      const ts = Date.now().toString(36).toUpperCase();
      const tickets = recipients.map((a, i) => ({
        order_id: order.id, ticket_type_id: ticketTypeId, event_id: eventId,
        owner_id: a.user_id, owner_email: a.email || '',
        unique_code: `COMP-${ts}-${i + 1}`,
        ticket_number: `Comp #${i + 1}`,
      }));
      await base44.entities.Ticket.bulkCreate(tickets);
      await base44.entities.TicketType.updateMany({ id: ticketTypeId }, { $inc: { quantity_sold: recipients.length } });

      let emailed = 0;
      if (notify) {
        const ev = events.find(e => e.id === eventId);
        const subject = `You've been comped to ${ev?.title || 'our event'}`;
        const body = `Good news — you've received a complimentary ticket to ${ev?.title || 'our event'}.\n\nYour ticket is now in your My Tickets tab on Planet Baltimore. We'll see you there!\n\n— ${user.full_name || 'Planet Baltimore'}`;
        for (const a of recipients) {
          if (a.email) { try { await base44.integrations.Core.SendEmail({ to: a.email, subject, body }); emailed++; } catch {} }
        }
      }

      qc.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast({
        title: `${recipients.length} complimentary ticket${recipients.length === 1 ? '' : 's'} issued`,
        description: notify ? `Tickets added to each account${emailed ? ` · ${emailed} emailed` : ''}.` : 'Tickets added to each account.',
      });
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
            <select value={eventId} onChange={e => { setEventId(e.target.value); setTicketTypeId(''); setSelected([]); }} className="w-full mt-1 h-10 rounded-lg bg-secondary/50 border-0 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
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
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Attendees</p>
                <div className="flex gap-2 text-xs">
                  <button onClick={selectAll} className="text-[#d4580a] font-medium hover:underline">Select all</button>
                  <button onClick={clearAll} className="text-muted-foreground hover:underline">Clear</button>
                </div>
              </div>
              {loadingAtt ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
              : attendees.length === 0 ? <p className="text-xs text-muted-foreground py-3">No attendees have RSVP'd to this event yet.</p>
              : (
                <div className="space-y-1 max-h-56 overflow-y-auto">
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
              <p className="text-xs text-muted-foreground mt-2">{selected.length} selected</p>
            </div>
          )}

          {eventId && ticketTypeId && selected.length > 0 && (
            <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
              <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} className="w-4 h-4 accent-[#d4580a]" />
              <span className="text-sm text-foreground flex-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email each recipient their comp ticket</span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-2 p-4 border-t border-border">
          <Button onClick={issue} disabled={sending} className="ml-auto text-white flex items-center gap-1.5" style={{ backgroundColor: '#d4580a' }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />} Issue {selected.length} comp{selected.length === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </div>
  );
}