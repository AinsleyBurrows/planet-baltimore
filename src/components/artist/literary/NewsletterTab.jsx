import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Mail, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

function IssueForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', subject: '', published_at: '', body_preview: '', url: '' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Issue title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Subject line" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link to full issue (optional)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
        <input className="w-40 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Sent date" type="date" value={form.published_at} onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Preview / teaser" value={form.body_preview} onChange={e => setForm(f => ({ ...f, body_preview: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function NewsletterTab({ artistId, ownerId, isOwner }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['newsletter-issues', artistId],
    queryFn: () => base44.entities.NewsletterIssue.filter({ artist_id: artistId }, '-published_at', 30),
    enabled: !!artistId,
  });

  const { data: writerProfile } = useQuery({
    queryKey: ['writer-profile', ownerId],
    queryFn: () => base44.entities.WriterProfile.filter({ user_id: ownerId }, null, 1),
    enabled: !!ownerId,
  });

  const subscriberCount = writerProfile?.[0]?.newsletter_subscribers ?? 0;
  const newsletterEnabled = writerProfile?.[0]?.newsletter_enabled ?? false;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['newsletter-issues', artistId] });
  const saveNew = async (form) => { await base44.entities.NewsletterIssue.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.NewsletterIssue.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (issue) => { if (!window.confirm('Remove this issue?')) return; await base44.entities.NewsletterIssue.delete(issue.id); refresh(); };

  const subscribe = async () => {
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) { toast({ title: 'Enter a valid email', variant: 'destructive' }); return; }
    setSubscribing(true);
    try {
      if (writerProfile?.[0]?.id) {
        await base44.entities.WriterProfile.update(writerProfile[0].id, { newsletter_subscribers: (writerProfile[0].newsletter_subscribers || 0) + 1, newsletter_enabled: true });
        queryClient.invalidateQueries({ queryKey: ['writer-profile', ownerId] });
      }
      setSubscribed(true); setEmail('');
    } catch { toast({ title: 'Could not subscribe', variant: 'destructive' }); }
    setSubscribing(false);
  };

  return (
    <div className="space-y-4">
      {/* Subscribe banner */}
      {!isOwner && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
          {subscribed ? (
            <div className="flex items-center gap-2 text-accent"><CheckCircle2 className="w-5 h-5" /><p className="text-sm font-medium">You're subscribed — thank you!</p></div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2"><Mail className="w-4 h-4 text-accent" /><p className="text-sm font-semibold text-foreground">Join the mailing list</p></div>
              <div className="flex gap-2">
                <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                <Button size="sm" onClick={subscribe} disabled={subscribing} className="bg-accent hover:bg-accent/90 text-accent-foreground">{subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}</Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Stats (owner-visible) */}
      <div className="flex gap-3">
        <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{subscriberCount}</p>
          <p className="text-xs text-muted-foreground">Subscribers</p>
        </div>
        <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{issues.length}</p>
          <p className="text-xs text-muted-foreground">Issues sent</p>
        </div>
      </div>

      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Issue</Button>
        </div>
      )}
      {showForm && <IssueForm onSave={saveNew} onCancel={() => setShowForm(false)} />}

      {isLoading
        ? <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        : issues.length === 0 && !showForm
          ? <p className="text-center py-8 text-sm text-muted-foreground">No newsletter issues yet.</p>
          : <div className="space-y-3">{issues.map(iss => editing?.id === iss.id
            ? <IssueForm key={iss.id} initial={iss} onSave={saveEdit} onCancel={() => setEditing(null)} />
            : (
              <div key={iss.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm">{iss.title}</p>
                    {iss.subject && <p className="text-xs text-muted-foreground italic truncate">{iss.subject}</p>}
                    {iss.published_at && <p className="text-[10px] text-muted-foreground mt-1">{new Date(iss.published_at).toLocaleDateString()}</p>}
                  </div>
                  {isOwner && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => setEditing(iss)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(iss)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                {iss.body_preview && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{iss.body_preview}</p>}
                {iss.url && <a href={iss.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">Read full issue →</a>}
              </div>
            ))}</div>}
    </div>
  );
}