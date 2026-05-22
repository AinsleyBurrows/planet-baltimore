import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Mail, Check, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

function parseEmails(text) {
  // Extract all valid-looking emails from raw text (CSV, newlines, semicolons, spaces)
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(emailRegex) || [];
  return [...new Set(found.map(e => e.toLowerCase()))];
}

export default function InviteFriendsModal({ onClose }) {
  const [emails, setEmails] = useState([]);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState(false);
  const [results, setResults] = useState([]); // { email, status: 'sent'|'error' }
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setRawText(text);
      const found = parseEmails(text);
      setEmails(found);
      setParsed(true);
    };
    reader.readAsText(file);
  };

  const handleParseText = () => {
    const found = parseEmails(rawText);
    setEmails(found);
    setParsed(true);
  };

  const handleRemoveEmail = (email) => {
    setEmails(prev => prev.filter(e => e !== email));
  };

  const handleSendInvites = async () => {
    setSending(true);
    const res = [];
    for (const email of emails) {
      try {
        await base44.users.inviteUser(email, 'user');
        res.push({ email, status: 'sent' });
      } catch {
        res.push({ email, status: 'error' });
      }
    }
    setResults(res);
    setSending(false);
  };

  const done = results.length > 0;
  const sentCount = results.filter(r => r.status === 'sent').length;

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
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Invite Friends</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {done ? (
              /* Results screen */
              <div className="space-y-3">
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="font-semibold text-foreground">{sentCount} invite{sentCount !== 1 ? 's' : ''} sent!</p>
                  <p className="text-sm text-muted-foreground mt-1">They'll receive an email: <span className="font-medium text-foreground">"You Are Invited To Join Planet Baltimore"</span></p>
                </div>
                {results.filter(r => r.status === 'error').length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />Failed to send:</p>
                    {results.filter(r => r.status === 'error').map(r => (
                      <p key={r.email} className="text-xs text-muted-foreground pl-4">{r.email}</p>
                    ))}
                  </div>
                )}
                <Button onClick={onClose} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Done</Button>
              </div>
            ) : (
              <>
                {/* Upload area */}
                {!parsed && (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-accent transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Upload a CSV or text file</p>
                    <p className="text-xs text-muted-foreground mt-1">Any file with emails — exported from Gmail, Outlook, etc.</p>
                    <input ref={fileInputRef} type="file" accept=".csv,.txt,.vcf" className="hidden" onChange={handleFileUpload} />
                  </div>
                )}

                {/* Paste area */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {parsed ? 'Edit raw email list' : 'Or paste emails directly'}
                  </label>
                  <textarea
                    className="w-full h-28 rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                    placeholder="john@example.com, jane@example.com..."
                    value={rawText}
                    onChange={e => { setRawText(e.target.value); setParsed(false); }}
                  />
                  {!parsed && (
                    <Button onClick={handleParseText} variant="outline" className="w-full" disabled={!rawText.trim()}>
                      <Mail className="w-4 h-4 mr-2" />Parse Emails
                    </Button>
                  )}
                </div>

                {/* Parsed email list */}
                {parsed && emails.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{emails.length} email{emails.length !== 1 ? 's' : ''} found</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {emails.map(email => (
                        <div key={email} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/60 text-sm">
                          <span className="text-foreground truncate">{email}</span>
                          <button
                            onClick={() => handleRemoveEmail(email)}
                            className="ml-2 p-0.5 rounded-full hover:text-destructive transition-colors text-muted-foreground flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsed && emails.length === 0 && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />No valid emails found. Try again.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer CTA */}
          {!done && parsed && emails.length > 0 && (
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <Button
                onClick={handleSendInvites}
                disabled={sending}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending invites...</>
                ) : (
                  <><UserPlus className="w-4 h-4 mr-2" />Send {emails.length} Invite{emails.length !== 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}