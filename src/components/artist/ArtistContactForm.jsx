import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Loader2, Briefcase, Music, Camera, Palette, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';

const INQUIRY_TYPES = [
  { id: 'collaborate', label: 'Collaborate', icon: Palette },
  { id: 'commission', label: 'Commission', icon: Briefcase },
  { id: 'book', label: 'Book / Perform', icon: Music },
  { id: 'photo', label: 'Photography', icon: Camera },
  { id: 'other', label: 'Other', icon: MessageSquare },
];

export default function ArtistContactForm({ artist }) {
  const [form, setForm] = useState({ name: '', email: '', inquiryType: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setSending(true);

    const subject = `${form.inquiryType ? `[${form.inquiryType}] ` : ''}Inquiry from ${form.name} via BMore Connected`;
    const body = `
Hi ${artist.name},

You have a new inquiry via BMore Connected.

Type: ${form.inquiryType || 'General'}
From: ${form.name} (${form.email})

Message:
${form.message}
    `.trim();

    if (artist.contact_email || artist.website) {
      await base44.integrations.Core.SendEmail({
        to: artist.contact_email || 'no-reply@bmoreconnected.com',
        subject,
        body,
      });
    }

    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-14 gap-4 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-lg">Message sent!</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {artist.name} will be in touch with you soon.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setForm({ name: '', email: '', inquiryType: '', message: '' }); }}
          className="text-sm text-accent hover:underline"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Inquiry type pills */}
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
          I want to…
        </Label>
        <div className="flex flex-wrap gap-2">
          {INQUIRY_TYPES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => update('inquiryType', form.inquiryType === id ? '' : id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                form.inquiryType === id
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-secondary text-muted-foreground border-transparent hover:border-border hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Your name <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            className="rounded-lg"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Your email <span className="text-destructive">*</span></Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            className="rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
        <Textarea
          id="message"
          placeholder={`Tell ${artist.name} about your project, timeline, budget, or any details that would help them respond…`}
          value={form.message}
          onChange={e => update('message', e.target.value)}
          className="rounded-lg resize-none min-h-[130px]"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={sending}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-11 font-semibold gap-2"
      >
        {sending ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
        ) : (
          <><Send className="w-4 h-4" />Send Message</>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your message goes directly to {artist.name}. No spam, ever.
      </p>
    </motion.form>
  );
}