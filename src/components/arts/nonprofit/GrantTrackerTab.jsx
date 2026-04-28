import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const STATUSES = ['Seeking', 'Applied', 'Under Review', 'Awarded', 'Declined'];
const STATUS_COLORS = {
  'Seeking': 'bg-blue-100 text-blue-700',
  'Applied': 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-purple-100 text-purple-700',
  'Awarded': 'bg-green-100 text-green-700',
  'Declined': 'bg-red-100 text-red-700',
};

const empty = { funder_name: '', grant_name: '', amount: '', status: 'Seeking', deadline: '', notes: '' };

export default function GrantTrackerTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const grants = org.grants || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  const save = async () => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { grants: [...grants, { ...form }] });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm(empty);
    setSaving(false);
  };

  const remove = async (idx) => {
    await base44.entities.ArtsOrganization.update(org.id, { grants: grants.filter((_, i) => i !== idx) });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const publicGrants = isOwner ? grants : grants.filter(g => g.status === 'Awarded');

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Public can only see awarded grants.</p>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Grant
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Funder Name *" value={form.funder_name} onChange={e => setForm(f => ({ ...f, funder_name: e.target.value }))} />
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Grant / Program Name" value={form.grant_name} onChange={e => setForm(f => ({ ...f, grant_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Amount (e.g. $5,000)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Deadline</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Notes (internal only)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.funder_name} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {publicGrants.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />
          {isOwner ? 'No grants logged yet.' : 'No awarded grants to display yet.'}
        </div>
      ) : (
        <div className="space-y-3">
          {publicGrants.map((grant, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-foreground">{grant.funder_name}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[grant.status] || 'bg-secondary text-muted-foreground'}`}>{grant.status}</span>
                  </div>
                  {grant.grant_name && <p className="text-sm text-muted-foreground">{grant.grant_name}</p>}
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    {grant.amount && <span className="flex items-center gap-1 text-sm font-semibold text-accent"><DollarSign className="w-3.5 h-3.5" />{grant.amount}</span>}
                    {isOwner && grant.deadline && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />Due {format(new Date(grant.deadline), 'MMM d, yyyy')}</span>}
                  </div>
                  {isOwner && grant.notes && <p className="text-xs text-muted-foreground mt-2 italic border-t border-border pt-2">{grant.notes}</p>}
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