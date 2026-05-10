import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Pin, Plus, Trash2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function CommunityAnnouncementsTab({ community, isOwner }) {
  const queryClient = useQueryClient();
  const announcements = community.hub_data?.announcements || [];
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const saveAll = async (list) => {
    await base44.entities.Community.update(community.id, {
      hub_data: { ...(community.hub_data || {}), announcements: list }
    });
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
  };

  const handleAdd = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await saveAll([{ title, body, created_at: new Date().toISOString(), pinned: false }, ...announcements]);
    setTitle(''); setBody(''); setShowForm(false); setSaving(false);
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Delete this announcement?')) return;
    await saveAll(announcements.filter((_, i) => i !== idx));
  };

  const togglePin = async (idx) => {
    await saveAll(announcements.map((a, i) => i === idx ? { ...a, pinned: !a.pinned } : a));
  };

  const sorted = [...announcements].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> New Announcement
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-24" placeholder="Message…" value={body} onChange={e => setBody(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !title.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Post'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showForm ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No announcements yet.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((a, i) => {
            const realIdx = announcements.indexOf(a);
            return (
              <div key={i} className={`p-4 rounded-xl border ${a.pinned ? 'border-accent/40 bg-accent/5' : 'border-border bg-card'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Pin className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                    <p className="font-semibold text-foreground text-sm">{a.title}</p>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => togglePin(realIdx)} className={`p-1 rounded hover:bg-secondary transition-colors ${a.pinned ? 'text-accent' : 'text-muted-foreground'}`} title={a.pinned ? 'Unpin' : 'Pin'}>
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(realIdx)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {a.body && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.body}</p>}
                <p className="text-xs text-muted-foreground mt-2">{a.created_at ? format(new Date(a.created_at), 'MMM d, yyyy') : ''}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}