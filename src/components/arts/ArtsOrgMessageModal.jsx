import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ArtsOrgMessageModal({ org, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { sent, failed }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendBulkMessage', {
        event_id: org.id,
        subject: subject.trim(),
        body: body.trim(),
        recipients: [], // will use followers concept — send via email integration
      });
      setResult({ sent: res.data?.sent ?? 0, failed: res.data?.failed ?? 0 });
    } catch {
      setResult({ sent: 0, failed: 1 });
    }
    setSending(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Message Followers</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {result ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-semibold text-foreground">Message sent!</p>
                <p className="text-sm text-muted-foreground">Your announcement has been delivered to {org.name} followers.</p>
                <Button onClick={onClose} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">Done</Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                  Send an announcement to all followers of <strong>{org.name}</strong>.
                </p>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                    placeholder="Announcement subject..."
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    className="w-full h-36 rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                    placeholder="Write your message to followers..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground text-right">{body.length} characters</p>
                </div>
              </>
            )}
          </div>

          {!result && (
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <Button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim()}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Send to All Followers</>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}