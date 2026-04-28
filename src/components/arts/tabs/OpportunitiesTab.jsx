import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const OPP_TYPES = ['Open Call', 'Grant', 'Residency', 'Job', 'Fellowship', 'Workshop', 'Other'];

const TYPE_COLORS = {
  'Open Call': 'bg-blue-100 text-blue-700',
  'Grant': 'bg-green-100 text-green-700',
  'Residency': 'bg-purple-100 text-purple-700',
  'Job': 'bg-amber-100 text-amber-700',
  'Fellowship': 'bg-pink-100 text-pink-700',
  'Workshop': 'bg-orange-100 text-orange-700',
  'Other': 'bg-secondary text-muted-foreground',
};

export default function OpportunitiesTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const opps = org.opportunities || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'Open Call', description: '', deadline: '', link: '' });

  const save = async () => {
    setSaving(true);
    const updated = [...opps, { ...form }];
    await base44.entities.ArtsOrganization.update(org.id, { opportunities: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm({ title: '', type: 'Open Call', description: '', deadline: '', link: '' });
    setSaving(false);
  };

  const remove = async (idx) => {
    const updated = opps.filter((_, i) => i !== idx);
    await base44.entities.ArtsOrganization.update(org.id, { opportunities: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Post Opportunity
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {OPP_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div><label className="text-xs text-muted-foreground">Deadline</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Apply / Learn More URL (optional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {opps.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No opportunities posted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {opps.map((opp, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-foreground">{opp.title}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[opp.type] || TYPE_COLORS.Other}`}>{opp.type}</span>
                  </div>
                  {opp.deadline && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" />Deadline: {format(new Date(opp.deadline), 'MMM d, yyyy')}
                    </p>
                  )}
                  {opp.description && <p className="text-sm text-muted-foreground">{opp.description}</p>}
                  {opp.link && (
                    <a href={opp.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2">
                      <ExternalLink className="w-3 h-3" />Apply / Learn More
                    </a>
                  )}
                </div>
                {isOwner && (
                  <button onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}