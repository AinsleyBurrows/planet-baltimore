import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, CheckCircle, Loader2, UserPlus, Upload, FileText } from 'lucide-react';
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
  const [csvFileName, setCsvFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleParse = (text) => {
    const found = parseEmails(text || inputText);
    setEmails(found);
    setStatuses({});
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setInputText(text);
      handleParse(text);
    };
    reader.readAsText(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
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
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-foreground">Invite People</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-muted-foreground">Invite people to <span className="font-medium text-foreground">{community.name}</span> by uploading a CSV or pasting emails below.</p>

          {/* CSV Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border hover:border-accent cursor-pointer transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
              <Upload className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              {csvFileName ? (
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">{csvFileName}</span>
                </div>
              ) : (
                <p className="text-sm font-medium text-foreground">Upload CSV or text file</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">Any file containing email addresses</p>
            </div>
            {csvFileName && <button onClick={(e) => { e.stopPropagation(); setCsvFileName(''); setInputText(''); setEmails([]); }} className="p-1 rounded-full hover:bg-secondary flex-shrink-0"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
          </div>
          <input ref={fileInputRef} type="file" accept=".csv,.txt,.vcf" className="hidden" onChange={handleFileUpload} />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or paste directly</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <textarea
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[90px]"
            placeholder="name@example.com, another@email.com…"
            value={inputText}
            onChange={e => { setInputText(e.target.value); setCsvFileName(''); }}
          />

          <Button variant="outline" size="sm" onClick={() => handleParse()} disabled={!inputText.trim()} className="w-full rounded-lg">
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
                  {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <><Send className="w-4 h-4" />Send {emails.length} Invitation{emails.length > 1 ? 's' : ''}</>}
                </Button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}