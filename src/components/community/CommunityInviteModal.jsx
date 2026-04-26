import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, CheckCircle, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

function parseEmails(text) {
  const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(regex) || [])];
}

export default function CommunityInviteModal({ community, onClose }) {
  const [inputText, setInputText] = useState('');
  const [emails, setEmails] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [sending, setSending] = useState(false);

  const handleParse = () => {
    const found = parseEmails(inputText);
    setEmails(found);
    setStatuses({});
  };

  const removeEmail = (email) => setEmails(prev => prev.filter(e => e !== email));

  const handleSend = async () => {
    if (!emails.length) return;
    setSending(true);
    const results = {};
    for (const email of emails) {
      try {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `You're invited to join "${community.name}" on Planet Baltimore`,
          body: `Hi!\n\nYou've been invited to join the community "${community.name}" on Planet Baltimore.\n\n${community.description ? community.description + '\n\n' : ''}Click the link below to explore and join:\n${window.location.href}\n\nSee you there!`,
        });
        results[email] = 'sent';
      } catch {
        results[email] = 'error';
      }
    }
    setStatuses(results);
    setSending(false);
  };

  const allSent = emails.length > 0 && emails.every(e => statuses[e] === 'sent');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-foreground">Invite People</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">Paste or type email addresses below (comma, space, or line-separated) to invite people to <span className="font-medium text-foreground">{community.name}</span>.</p>

          <textarea
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
            placeholder="name@example.com, another@email.com…"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />

          <Button variant="outline" size="sm" onClick={handleParse} disabled={!inputText.trim()} className="w-full rounded-lg">
            Parse Emails
          </Button>

          {emails.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{emails.length} email{emails.length > 1 ? 's' : ''} found:</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {emails.map(email => (
                  <div key={email} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    statuses[email] === 'sent' ? 'bg-green-500/10 text-green-600' :
                    statuses[email] === 'error' ? 'bg-destructive/10 text-destructive' :
                    'bg-secondary text-foreground'
                  }`}>
                    {statuses[email] === 'sent' && <CheckCircle className="w-3 h-3" />}
                    {email}
                    {!statuses[email] && (
                      <button onClick={() => removeEmail(email)} className="ml-0.5 hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {allSent ? (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium py-2">
                  <CheckCircle className="w-4 h-4" /> Invitations sent!
                </div>
              ) : (
                <Button onClick={handleSend} disabled={sending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2 mt-2">
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <><Send className="w-4 h-4" />Send Invitations</>}
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}