import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromoterMessageTool({ eventId }) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const { data: attendees = [] } = useQuery({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      const rsvps = await base44.entities.RSVP.filter({ event_id: eventId }, '-created_date', 200);
      const tickets = await base44.entities.Ticket.filter({ event_id: eventId }, '-created_date', 200);
      const allEmails = new Set([
        ...rsvps.map(r => r.attendee_email).filter(Boolean),
        ...tickets.map(t => t.owner_email).filter(Boolean),
      ]);
      return Array.from(allEmails);
    },
    enabled: !!eventId,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendBulkMessage', {
        eventId,
        subject,
        message,
        recipientEmails: attendees,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResult({ type: 'success', message: `Email sent to ${data.deliveredCount} attendees` });
      setSubject('');
      setMessage('');
      setTimeout(() => setResult(null), 4000);
    },
    onError: (error) => {
      setResult({ type: 'error', message: error.message });
    },
  });

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      setResult({ type: 'error', message: 'Subject and message are required' });
      return;
    }
    sendMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Message {attendees.length} attendees</p>
          <p className="text-xs mt-1">Includes RSVPs and ticket holders</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="e.g., Special 20% Discount for VIP Attendees"
          className="w-full mt-2 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write your message here. Include updates, special offers, or event details..."
          rows={6}
          className="w-full mt-2 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1">{message.length}/2000 characters</p>
      </div>

      {result && (
        <div className={`p-3 rounded-lg flex gap-2 items-start ${
          result.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-destructive/10 border border-destructive/30'
        }`}>
          {result.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${result.type === 'success' ? 'text-green-700' : 'text-destructive'}`}>
            {result.message}
          </p>
        </div>
      )}

      <Button
        onClick={handleSend}
        disabled={sendMutation.isPending || attendees.length === 0 || !subject.trim() || !message.trim()}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg"
      >
        {sendMutation.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
        ) : (
          <><Send className="w-4 h-4" /> Send to {attendees.length} {attendees.length === 1 ? 'Attendee' : 'Attendees'}</>
        )}
      </Button>
    </div>
  );
}