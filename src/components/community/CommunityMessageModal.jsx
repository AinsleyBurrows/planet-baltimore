import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Send, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function CommunityMessageModal({ community, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);

    // Fetch all members/followers of this community via Follow entity
    const follows = await base44.entities.Follow.filter({
      target_type: 'community',
      target_id: community.id,
    });

    const emails = follows
      .map(f => f.follower_email)
      .filter(Boolean);

    // Send email to each member
    const emailPromises = emails.map(email =>
      base44.integrations.Core.SendEmail({
        to: email,
        subject: subject || `Message from ${community.name}`,
        body: `${message}\n\n—\nThis message was sent to all members of ${community.name} on Planet Baltimore.`,
      }).catch(() => {})
    );

    await Promise.all(emailPromises);
    setSending(false);
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div>
            <h3 className="font-semibold text-foreground">Message All Members</h3>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Users className="w-3 h-3" /> Sends to all {community.name} followers
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 gap-3">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <p className="font-semibold text-foreground text-lg">Message Sent!</p>
            <p className="text-sm text-muted-foreground text-center">Your message was sent to all community members.</p>
            <Button onClick={onClose} className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-8">Done</Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
              <input
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={`Message from ${community.name}`}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Message *</label>
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[140px]"
                placeholder="Write your message to all community members…"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">Members will receive this as an email. Your name and community name will be included.</p>
          </div>
        )}

        {!sent && (
          <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2"
            >
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <><Send className="w-4 h-4" />Send to All Members</>}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}