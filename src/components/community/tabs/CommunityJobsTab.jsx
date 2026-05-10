import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ExternalLink, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const TYPES = ['job', 'gig', 'collab', 'volunteer', 'other'];
const TYPE_COLORS = {
  job: 'bg-blue-100 text-blue-700',
  gig: 'bg-purple-100 text-purple-700',
  collab: 'bg-green-100 text-green-700',
  volunteer: 'bg-orange-100 text-orange-700',
  other: 'bg-secondary text-secondary-foreground',
};

export default function CommunityJobsTab({ community, user }) {
  const queryClient = useQueryClient();
  const jobs = community.hub_data?.jobs || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'job', contact: '', link: '', compensation: '' });
  const [saving, setSaving] = useState(false);

  const saveAll = async (list) => {
    await base44.entities.Community.update(community.id, {
      hub_data: { ...(community.hub_data || {}), jobs: list }
    });
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
  };

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await saveAll([{ ...form, posted_by: user?.full_name || 'Anonymous', posted_by_id: user?.id, created_at: new Date().toISOString() }, ...jobs]);
    setForm({ title: '', description: '', type: 'job', contact: '', link: '', compensation: '' });
    setShowForm(false); setSaving(false);
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Remove this posting?')) return;
    await saveAll(jobs.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {user && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Post Opportunity
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description / details…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Compensation (optional)" value={form.compensation} onChange={e => setForm(f => ({ ...f, compensation: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Contact email or link" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="External link (optional)" value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.title.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Posting…' : 'Post'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {jobs.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No opportunities posted yet.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((j, i) => (
            <div key={i} className="p-4 bg-card border border-border rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="font-semibold text-foreground text-sm">{j.title}</p>
                  <Badge className={`text-xs capitalize border-0 ${TYPE_COLORS[j.type] || TYPE_COLORS.other}`}>{j.type}</Badge>
                </div>
                {(user?.id === j.posted_by_id || user?.role === 'admin') && (
                  <button onClick={() => handleDelete(i)} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {j.description && <p className="text-sm text-muted-foreground">{j.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {j.compensation && <span>💰 {j.compensation}</span>}
                {j.contact && <span>📧 {j.contact}</span>}
                {j.posted_by && <span>Posted by {j.posted_by}</span>}
                {j.created_at && <span>{format(new Date(j.created_at), 'MMM d, yyyy')}</span>}
              </div>
              {j.link && (
                <a href={j.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                  <ExternalLink className="w-3 h-3" /> View full posting
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}