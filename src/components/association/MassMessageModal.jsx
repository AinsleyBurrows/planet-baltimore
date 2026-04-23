import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Eye, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = { COMPOSE: 'compose', PREVIEW: 'preview', CONFIRM: 'confirm', SENT: 'sent' };

export default function MassMessageModal({ association, memberCount, onClose }) {
  const [step, setStep] = useState(STEPS.COMPOSE);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handlePreview = () => {
    if (!message.trim()) return;
    setStep(STEPS.PREVIEW);
  };

  const handleConfirm = () => setStep(STEPS.CONFIRM);

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await base44.functions.invoke('sendMassMessage', {
        association_id: association.id,
        subject,
        message,
        preview_only: false,
      });
      setResult(res.data);
      setStep(STEPS.SENT);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to send.');
      setStep(STEPS.PREVIEW);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-background rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Message All Members</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{memberCount} recipients</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* COMPOSE */}
            {step === STEPS.COMPOSE && (
              <motion.div key="compose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <Label>Subject (optional)</Label>
                  <Input className="mt-1" placeholder="Community announcement..." value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div>
                  <Label>Message *</Label>
                  <Textarea className="mt-1" rows={6} placeholder="Write your message to all members..." value={message} onChange={e => setMessage(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">{message.length} characters</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                  <Button onClick={handlePreview} disabled={!message.trim()} className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Eye className="w-4 h-4" />Preview
                  </Button>
                </div>
              </motion.div>
            )}

            {/* PREVIEW */}
            {step === STEPS.PREVIEW && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Preview</p>
                  <p className="font-semibold text-foreground">{subject || `Message from ${association.name}`}</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{message}</p>
                  <p className="text-xs text-muted-foreground">— {association.name} Leadership Team</p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl text-sm text-muted-foreground">
                  <Users className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Will be delivered to <strong className="text-foreground">{memberCount}</strong> members as in-app notification + inbox message. Email notifications sent to members who opted in.</span>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-xl text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(STEPS.COMPOSE)} className="flex-1">Back</Button>
                  <Button onClick={handleConfirm} className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Send className="w-4 h-4" />Send to {memberCount} Members
                  </Button>
                </div>
              </motion.div>
            )}

            {/* CONFIRM */}
            {step === STEPS.CONFIRM && (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 text-center py-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Confirm Send</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    You are about to send an official message to all <strong>{memberCount}</strong> members of <strong>{association.name}</strong>. This cannot be undone.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-xl">
                  Rate limit: You can send one mass message every 24 hours.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(STEPS.PREVIEW)} className="flex-1">Go Back</Button>
                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {sending ? 'Sending...' : <><Send className="w-4 h-4" />Confirm &amp; Send</>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* SENT */}
            {step === STEPS.SENT && (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5 text-center py-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Message Sent!</h3>
                  {result && (
                    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                      <p><strong className="text-foreground">{result.delivered}</strong> in-app notifications delivered</p>
                      {result.emails_sent > 0 && <p><strong className="text-foreground">{result.emails_sent}</strong> email notifications sent</p>}
                    </div>
                  )}
                </div>
                <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Done</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}