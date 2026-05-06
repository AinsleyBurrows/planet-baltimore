import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const EMPTY = { title: '', body: '', sent_at: new Date().toISOString().split('T')[0] };

function AnnouncementForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-28" placeholder="Announcement body" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
      <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.sent_at} onChange={e => setForm(f => ({ ...f, sent_at: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function AnnouncementsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const announcements = org.announcements || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtsOrganization.update(org.id, { announcements: list });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([form, ...announcements]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save(announcements.map((a, i) => i === editIdx ? { ...a, ...form } : a)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this announcement?')) return; await save(announcements.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> New Announcement
          </Button>
        </div>
      )}
      {showForm && <AnnouncementForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {announcements.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <div key={i}>
              {editIdx === i ? (
                <AnnouncementForm initial={a} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
              ) : (
                <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{a.title}</p>
                      {a.sent_at && <p className="text-xs text-muted-foreground">{format(new Date(a.sent_at), 'MMM d, yyyy')}</p>}
                    </div>
                    {isOwner && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditIdx(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {a.body && <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{a.body}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}