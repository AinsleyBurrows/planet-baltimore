import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function AnnouncementsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const announcements = [...(org.announcements || [])].reverse(); // newest first
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });

  const save = async () => {
    setSaving(true);
    const entry = { ...form, sent_at: new Date().toISOString() };
    const updated = [...(org.announcements || []), entry];
    await base44.entities.ArtsOrganization.update(org.id, { announcements: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm({ title: '', body: '' });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> New Announcement
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-medium" placeholder="Announcement title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-28" placeholder="Write your announcement…" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.title || !form.body} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Publish'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {announcements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Megaphone className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{ann.title}</p>
                  {ann.sent_at && <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(ann.sent_at), 'MMM d, yyyy · h:mm a')}</p>}
                  <p className="text-sm text-foreground mt-2 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}