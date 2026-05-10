import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, ShieldCheck, Users, Globe, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CommunityRulesTab({ community, isOwner }) {
  const queryClient = useQueryClient();
  const rules = community.hub_data?.rules || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [saving, setSaving] = useState(false);

  const saveAll = async (list) => {
    await base44.entities.Community.update(community.id, {
      hub_data: { ...(community.hub_data || {}), rules: list }
    });
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (editIdx !== null) {
      await saveAll(rules.map((r, i) => i === editIdx ? form : r));
      setEditIdx(null);
    } else {
      await saveAll([...rules, form]);
      setShowForm(false);
    }
    setForm({ title: '', description: '' });
    setSaving(false);
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Remove this rule?')) return;
    await saveAll(rules.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* About / Info card */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2"><Users className="w-4 h-4 text-accent" /> About this Community</h3>
        {community.description && <p className="text-sm text-muted-foreground leading-relaxed">{community.description}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {community.owner_name && <span>👤 Organizer: <strong className="text-foreground">{community.owner_name}</strong></span>}
          {community.members_count > 0 && <span>👥 {community.members_count.toLocaleString()} members</span>}
          {community.neighborhood_name && <span>📍 {community.neighborhood_name}</span>}
          {community.website && (
            <a href={community.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline">
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          )}
          {community.contact_email && (
            <a href={`mailto:${community.contact_email}`} className="flex items-center gap-1 text-accent hover:underline">
              <Mail className="w-3.5 h-3.5" /> Contact
            </a>
          )}
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-accent" /> Community Rules</h3>
          {isOwner && !showForm && editIdx === null && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
              <Plus className="w-3.5 h-3.5" /> Add Rule
            </Button>
          )}
        </div>

        {(showForm || editIdx !== null) && (
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Rule title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !form.title.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditIdx(null); setForm({ title: '', description: '' }); }}>Cancel</Button>
            </div>
          </div>
        )}

        {rules.length === 0 && !showForm ? (
          <p className="text-center py-8 text-sm text-muted-foreground">No rules posted yet.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={i} className="flex gap-3 p-4 bg-card border border-border rounded-xl">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{r.title}</p>
                  {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                </div>
                {isOwner && editIdx !== i && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setEditIdx(i); setForm(r); setShowForm(false); }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(i)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}