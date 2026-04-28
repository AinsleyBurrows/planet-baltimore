import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, CheckCircle2, AlertCircle, Mail, Users, Crown, Zap, Star, Tag, Ticket } from 'lucide-react';

const GROUP_ICONS = { vip: Crown, early_bird: Zap, free: Star, group: Users, donation: Tag, general: Ticket };

export default function AttendeeMessaging({ event, orders, ticketTypes }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientFilter, setRecipientFilter] = useState('all'); // 'all' | ticket type id
  const [status, setStatus] = useState(null);

  const completedOrders = orders.filter(o => o.payment_status === 'completed');

  // Build recipient list based on filter
  const targetOrders = recipientFilter === 'all'
    ? completedOrders
    : completedOrders.filter(o => o.ticket_type_id === recipientFilter);

  const uniqueEmails = [...new Set(targetOrders.map(o => o.buyer_email).filter(Boolean))];

  const ttMap = Object.fromEntries((ticketTypes || []).map(t => [t.id, t]));

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (uniqueEmails.length === 0) throw new Error('No attendees with email addresses');

      await base44.functions.invoke('sendBulkMessage', {
        recipients: uniqueEmails,
        subject,
        message,
        eventTitle: event.title,
      });
    },
    onSuccess: () => {
      setStatus({ type: 'success', text: `Message sent to ${uniqueEmails.length} attendee${uniqueEmails.length !== 1 ? 's' : ''}` });
      setSubject('');
      setMessage('');
      setTimeout(() => setStatus(null), 6000);
    },
    onError: (err) => setStatus({ type: 'error', text: err.message || 'Failed to send message' }),
  });

  const isValid = subject.trim() && message.trim() && uniqueEmails.length > 0;

  const QUICK_TEMPLATES = [
    { label: '📍 Venue Update', subject: `Venue Update — ${event.title}`, body: `Hi! We have an update about the venue for ${event.title}. Please read below for the latest details.` },
    { label: '⏰ Reminder', subject: `Reminder: ${event.title} is coming up!`, body: `Just a friendly reminder that ${event.title} is happening soon. We can't wait to see you there!` },
    { label: '🎉 Thank You', subject: `Thank you for attending ${event.title}!`, body: `Thank you so much for joining us at ${event.title}. We hope you had an amazing time!` },
    { label: '⚠️ Important Update', subject: `Important Update — ${event.title}`, body: `We have an important update regarding ${event.title}. Please read the details below carefully.` },
  ];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Mail className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">Message Your Attendees</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send emails directly to ticket buyers for <span className="font-medium text-foreground">{event.title}</span>
          </p>
        </div>
      </div>

      {/* Recipient filter */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Send To</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRecipientFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
              ${recipientFilter === 'all' ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-accent/40 text-foreground'}`}
          >
            <Users className="w-3.5 h-3.5" />
            All Ticket Buyers
            <span className="ml-1 text-xs bg-secondary px-1.5 py-0.5 rounded-full">{completedOrders.length}</span>
          </button>
          {ticketTypes.map(tt => {
            const Icon = GROUP_ICONS[tt.ticket_type_group] || Ticket;
            const count = completedOrders.filter(o => o.ticket_type_id === tt.id).length;
            return (
              <button
                key={tt.id}
                onClick={() => setRecipientFilter(tt.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
                  ${recipientFilter === tt.id ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-accent/40 text-foreground'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tt.name}
                <span className="ml-1 text-xs bg-secondary px-1.5 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {uniqueEmails.length} unique email{uniqueEmails.length !== 1 ? 's' : ''} will receive this message
        </p>
      </div>

      {/* Quick templates */}
      <div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Quick Templates</label>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_TEMPLATES.map(tpl => (
            <button
              key={tpl.label}
              onClick={() => { setSubject(tpl.subject); setMessage(tpl.body); }}
              className="text-left px-3 py-2.5 rounded-xl border border-border hover:border-accent/50 hover:bg-accent/5 transition-all text-xs font-medium text-foreground"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Subject *</label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="e.g., Important update about your tickets"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{subject.length}/120</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Message *</label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            placeholder="Write your message to attendees here..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={6}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/1000</p>
        </div>
      </div>

      {/* Status feedback */}
      {status && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${status.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {status.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
          <p className={`text-sm font-medium ${status.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{status.text}</p>
        </div>
      )}

      {/* Send button */}
      <Button
        onClick={() => {
          if (window.confirm(`Send this email to ${uniqueEmails.length} attendee${uniqueEmails.length !== 1 ? 's' : ''}?`)) {
            sendMutation.mutate();
          }
        }}
        disabled={!isValid || sendMutation.isPending}
        className="w-full h-12 rounded-xl font-semibold gap-2 bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
      >
        {sendMutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
        ) : (
          <><Send className="w-4 h-4" /> Send to {uniqueEmails.length} Attendee{uniqueEmails.length !== 1 ? 's' : ''}</>
        )}
      </Button>
    </div>
  );
}