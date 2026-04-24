import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function BulkMessaging({ eventId, eventTitle }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState('all');
  const [status, setStatus] = useState(null);

  const { data: rsvps = [] } = useQuery({
    queryKey: ['rsvps', eventId],
    queryFn: () => base44.entities.RSVP.filter({ event_id: eventId }),
    enabled: !!eventId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.User.list(),
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const going = rsvps.filter(r => r.status === 'going');
  const interested = rsvps.filter(r => r.status === 'interested');

  let targetAttendees = [];
  if (recipientType === 'all') {
    targetAttendees = rsvps;
  } else if (recipientType === 'going') {
    targetAttendees = going;
  } else if (recipientType === 'interested') {
    targetAttendees = interested;
  }

  const sendMutation = useMutation({
    mutationFn: async () => {
      const targetEmails = targetAttendees
        .map(r => userMap[r.user_id]?.email)
        .filter(Boolean);

      const response = await base44.functions.invoke('sendBulkMessage', {
        recipients: targetEmails,
        subject,
        message,
        eventTitle,
      });

      return response.data;
    },
    onSuccess: () => {
      setStatus({ type: 'success', message: `Message sent to ${targetAttendees.length} attendee(s)` });
      setSubject('');
      setMessage('');
      setTimeout(() => setStatus(null), 5000);
    },
    onError: (error) => {
      setStatus({ type: 'error', message: error.message || 'Failed to send message' });
    },
  });

  const isFormValid = subject.trim() && message.trim() && targetAttendees.length > 0;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Info box */}
      <div className="p-4 rounded-xl bg-secondary/40 border border-border">
        <p className="text-sm text-foreground mb-2">
          Send an update or reminder to event participants
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Event: <span className="font-medium text-foreground">{eventTitle}</span></span>
          <span>Total RSVPs: <span className="font-medium text-foreground">{rsvps.length}</span></span>
        </div>
      </div>

      {/* Recipient selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Recipients</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'all', label: 'All', count: rsvps.length },
            { value: 'going', label: 'Going', count: going.length },
            { value: 'interested', label: 'Interested', count: interested.length },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setRecipientType(option.value)}
              className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                recipientType === option.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border hover:border-accent text-foreground'
              }`}
            >
              {option.label}
              <span className="block text-xs text-muted-foreground mt-0.5">{option.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Subject</label>
          <Input
            placeholder="e.g., Event reminder - See you soon!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground mt-1">{subject.length}/100</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground block mb-1.5">Message</label>
          <Textarea
            placeholder="Write your message here. Include event details, reminders, or important updates..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="h-32"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">{message.length}/500</p>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 ${
            status.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-destructive/10 border border-destructive/20'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
          )}
          <p className={`text-sm ${status.type === 'success' ? 'text-green-700' : 'text-destructive'}`}>
            {status.message}
          </p>
        </div>
      )}

      {/* Send button */}
      <Button
        onClick={() => {
          if (window.confirm(`Send to ${targetAttendees.length} attendee(s)?`)) {
            sendMutation.mutate();
          }
        }}
        disabled={!isFormValid || sendMutation.isPending}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 rounded-lg font-semibold gap-2"
      >
        {sendMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Send to {targetAttendees.length} {targetAttendees.length === 1 ? 'Person' : 'People'}
          </>
        )}
      </Button>
    </div>
  );
}