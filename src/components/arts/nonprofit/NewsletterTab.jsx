import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Mail, ExternalLink, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const emptyIssue = { title: '', date: '', url: '', summary: '' };

export default function NewsletterTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const newsletter = org.newsletter || { signup_url: '', signup_embed: '', issues: [] };
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(newsletter);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [newIssue, setNewIssue] = useState(emptyIssue);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const saveSettings = async () => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { newsletter: form });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setEditing(false);
    setSaving(false);
  };

  const addIssue = () => {
    if (!newIssue.title) return;
    const entry = { ...newIssue, date: newIssue.date || new Date().toISOString().split('T')[0] };
    setForm(f => ({ ...f, issues: [...(f.issues || []), entry] }));
    setNewIssue(emptyIssue);
    setShowIssueForm(false);
  };

  const removeIssue = async (idx) => {
    const updated = { ...newsletter, issues: newsletter.issues.filter((_, i) => i !== idx) };
    await base44.entities.ArtsOrganization.update(org.id, { newsletter: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    // Store subscriber email on org record
    const subs = [...(org.newsletter_subscribers || []), { email: email.trim(), signed_up_at: new Date().toISOString() }];
    await base44.entities.ArtsOrganization.update(org.id, { newsletter_subscribers: subs });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    toast({ title: "You're subscribed!", description: `We'll keep you updated from ${org.name}.` });
    setEmail('');
    setSubscribing(false);
  };

  const display = editing ? form : newsletter;
  const issues = [...(display.issues || [])].reverse();

  return (
    <div className="space-y-5">
      {isOwner && (
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={saveSettings} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5"><Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Save'}</Button>
              <Button size="sm" variant="outline" onClick={() => { setForm(newsletter); setEditing(false); }}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => { setForm(newsletter); setEditing(true); }} className="gap-1.5"><Mail className="w-3.5 h-3.5" />Edit Newsletter Settings</Button>
          )}
        </div>
      )}

      {/* Signup section */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="font-bold text-foreground text-lg">Stay in the loop</h3>
          <p className="text-sm text-muted-foreground mt-1">Subscribe to updates from {org.name}</p>
        </div>

        {display.signup_url ? (
          <a href={display.signup_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors">
            <ExternalLink className="w-4 h-4" /> Subscribe Now
          </a>
        ) : (
          <form onSubmit={handleSignup} className="flex gap-2 max-w-sm mx-auto">
            <input
              type="email"
              className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={subscribing} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-1.5 px-4">
              <Send className="w-4 h-4" />{subscribing ? '…' : 'Subscribe'}
            </Button>
          </form>
        )}

        {editing && (
          <div className="mt-2 text-left space-y-2">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="External signup URL (e.g. Mailchimp link — overrides built-in form)" value={form.signup_url || ''} onChange={e => setForm(f => ({ ...f, signup_url: e.target.value }))} />
          </div>
        )}

        {isOwner && (
          <p className="text-xs text-muted-foreground">{(org.newsletter_subscribers || []).length} subscriber{(org.newsletter_subscribers || []).length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Past Issues */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Past Issues</p>
          {isOwner && editing && <button onClick={() => setShowIssueForm(v => !v)} className="text-xs text-accent hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Issue</button>}
        </div>

        {isOwner && editing && showIssueForm && (
          <div className="bg-secondary/50 rounded-xl p-3 space-y-2 mb-3">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Issue Title *" value={newIssue.title} onChange={e => setNewIssue(n => ({ ...n, title: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Summary (optional)" value={newIssue.summary} onChange={e => setNewIssue(n => ({ ...n, summary: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={newIssue.date} onChange={e => setNewIssue(n => ({ ...n, date: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="URL (optional)" value={newIssue.url} onChange={e => setNewIssue(n => ({ ...n, url: e.target.value }))} />
            </div>
            <Button size="sm" onClick={addIssue} className="bg-accent hover:bg-accent/90 text-accent-foreground">Add Issue</Button>
          </div>
        )}

        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No past issues archived yet.</p>
        ) : (
          <div className="space-y-2">
            {issues.map((issue, i) => {
              const globalIdx = (display.issues || []).length - 1 - i;
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{issue.title}</p>
                    {issue.date && <p className="text-xs text-muted-foreground">{format(new Date(issue.date), 'MMMM d, yyyy')}</p>}
                    {issue.summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.summary}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {issue.url && <a href={issue.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                    {isOwner && !editing && <button onClick={() => removeIssue(globalIdx)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}