import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, HandHeart, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ROLES = ['Volunteer', 'Committee Member', 'Event Staff', 'Educator', 'Outreach', 'Tech Support', 'Marketing', 'Other'];
const empty = { name: '', role: 'Volunteer', committee: '', email: '', phone: '', availability: '', image_url: '' };

export default function VolunteersTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const volunteers = org.volunteers || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  const save = async () => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { volunteers: [...volunteers, { ...form }] });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm(empty);
    setSaving(false);
  };

  const remove = async (idx) => {
    await base44.entities.ArtsOrganization.update(org.id, { volunteers: volunteers.filter((_, i) => i !== idx) });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  // Public sees name, role, committee only — no contact info
  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Volunteer
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Committee (optional)" value={form.committee} onChange={e => setForm(f => ({ ...f, committee: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Email (internal)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Phone (internal)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Availability (e.g. Weekends, Events only)" value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.name} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {volunteers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <HandHeart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No volunteers or committee members listed yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {volunteers.map((v, i) => (
            <div key={i} className="flex gap-3 p-4 bg-card border border-border rounded-xl">
              <Avatar className="w-12 h-12 rounded-xl flex-shrink-0">
                <AvatarImage src={v.image_url} />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{v.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{v.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <Badge variant="secondary" className="text-xs">{v.role}</Badge>
                      {v.committee && <span className="text-xs text-muted-foreground">{v.committee}</span>}
                    </div>
                  </div>
                  {isOwner && (
                    <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {isOwner && (
                  <div className="mt-1.5 space-y-0.5">
                    {v.email && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{v.email}</p>}
                    {v.phone && <p className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{v.phone}</p>}
                    {v.availability && <p className="text-xs text-muted-foreground italic">{v.availability}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}