import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const TYPES = ['open call', 'grant', 'job', 'residency', 'fellowship', 'workshop', 'volunteer', 'other'];
const EMPTY = { title: '', type: 'open call', description: '', deadline: '', link: '' };

function OpportunityForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="flex gap-2">
        <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Deadline" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Apply / Learn more URL" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function OpportunitiesTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const opportunities = org.opportunities || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtsOrganization.update(org.id, { opportunities: list });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([...opportunities, form]); setShowForm(false); setSaving(false); };
  const saveEdit = async (form) => { setSaving(true); await save(opportunities.map((o, i) => i === editIdx ? { ...o, ...form } : o)); setEditIdx(null); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this opportunity?')) return; await save(opportunities.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Opportunity
          </Button>
        </div>
      )}
      {showForm && <OpportunityForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {opportunities.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No opportunities listed yet.</p>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp, i) => (
            <div key={i}>
              {editIdx === i ? (
                <OpportunityForm initial={opp} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
              ) : (
                <div className="p-4 bg-card border border-border rounded-xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">{opp.title}</p>
                        <Badge variant="secondary" className="text-xs capitalize">{opp.type}</Badge>
                      </div>
                      {opp.deadline && <p className="text-xs text-muted-foreground mt-0.5">Deadline: {format(new Date(opp.deadline), 'MMM d, yyyy')}</p>}
                    </div>
                    {isOwner && (
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditIdx(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {opp.description && <p className="text-sm text-muted-foreground">{opp.description}</p>}
                  {opp.link && (
                    <a href={opp.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                      <ExternalLink className="w-3 h-3" />Apply / Learn More
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}