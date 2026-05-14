import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, Loader2, Trash2, Users, Calendar, ExternalLink, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast } from 'date-fns';

const COLLAB_TYPES = [
  { value: 'model', label: 'Model Call' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'stylist', label: 'Stylist' },
  { value: 'mua', label: 'Makeup Artist' },
  { value: 'designer', label: 'Designer Collab' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'brand_collab', label: 'Brand Collab' },
  { value: 'open_call', label: 'Open Call' },
  { value: 'other', label: 'Other' },
];

const TYPE_COLORS = {
  model: 'bg-pink-500/10 text-pink-600',
  photographer: 'bg-blue-500/10 text-blue-600',
  stylist: 'bg-purple-500/10 text-purple-600',
  mua: 'bg-rose-500/10 text-rose-600',
  designer: 'bg-amber-500/10 text-amber-600',
  videographer: 'bg-cyan-500/10 text-cyan-600',
  brand_collab: 'bg-green-500/10 text-green-600',
  open_call: 'bg-accent/10 text-accent',
  other: 'bg-muted text-muted-foreground',
};

function CollabForm({ artistId, ownerId, collab, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: collab?.title || '',
    description: collab?.description || '',
    collab_type: collab?.collab_type || 'open_call',
    deadline: collab?.deadline || '',
    compensation: collab?.compensation || '',
    apply_link: collab?.apply_link || '',
    apply_email: collab?.apply_email || '',
    location: collab?.location || '',
    is_paid: collab?.is_paid ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, artist_id: artistId, owner_id: ownerId, type: 'collab_call' };
    if (collab?.id) {
      await base44.entities.StudioUpdate.update(collab.id, data);
    } else {
      await base44.entities.StudioUpdate.create(data);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{collab ? 'Edit Call' : 'Post a Collab Call'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Type of collaboration</label>
          <select className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.collab_type} onChange={e => setForm(p => ({ ...p, collab_type: e.target.value }))}>
            {COLLAB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Title / role *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[90px]" placeholder="Describe what you're looking for, requirements, vibe, etc." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
            <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Location</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g. Baltimore, MD" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_paid} onChange={e => setForm(p => ({ ...p, is_paid: e.target.checked }))} className="rounded" />
          <span className="text-sm text-muted-foreground">This is a paid opportunity</span>
        </label>

        {form.is_paid && (
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Compensation details (e.g. $150/hr, trade, TBD)" value={form.compensation} onChange={e => setForm(p => ({ ...p, compensation: e.target.value }))} />
        )}

        <div className="space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Apply link (optional)" value={form.apply_link} onChange={e => setForm(p => ({ ...p, apply_link: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Or apply email (optional)" value={form.apply_email} onChange={e => setForm(p => ({ ...p, apply_email: e.target.value }))} />
        </div>

        <Button onClick={handleSave} disabled={!form.title || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : (collab ? 'Save Changes' : 'Post Call')}
        </Button>
      </motion.div>
    </div>
  );
}

export default function CollabCallsTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCollab, setEditingCollab] = useState(null);

  const { data: collabs = [], isLoading } = useQuery({
    queryKey: ['collab-calls', artistId],
    queryFn: () => base44.entities.StudioUpdate.filter({ artist_id: artistId, type: 'collab_call' }, '-created_date', 30),
    enabled: !!artistId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StudioUpdate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collab-calls', artistId] }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['collab-calls', artistId] });
    setShowForm(false);
    setEditingCollab(null);
  };

  const open = collabs.filter(c => !c.deadline || !isPast(new Date(c.deadline)));
  const closed = collabs.filter(c => c.deadline && isPast(new Date(c.deadline)));

  const CollabCard = ({ c }) => {
    const typeLabel = COLLAB_TYPES.find(t => t.value === c.collab_type)?.label || c.collab_type;
    const isExpired = c.deadline && isPast(new Date(c.deadline));

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className={`group relative rounded-xl border bg-card p-4 hover:shadow-md transition-all ${isExpired ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={`border-0 text-[10px] ${TYPE_COLORS[c.collab_type] || TYPE_COLORS.other}`}>{typeLabel}</Badge>
              {c.is_paid && <Badge className="border-0 text-[10px] bg-green-500/10 text-green-600">Paid</Badge>}
              {isExpired && <Badge variant="secondary" className="text-[10px]">Closed</Badge>}
            </div>
            <h3 className="font-semibold text-sm text-foreground">{c.title}</h3>
          </div>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setEditingCollab(c); setShowForm(true); }} className="p-1.5 rounded-lg bg-secondary hover:bg-muted text-xs text-muted-foreground">Edit</button>
              <button onClick={() => { if (window.confirm('Delete this call?')) deleteMutation.mutate(c.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>

        {c.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{c.description}</p>}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
          {c.location && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.location}</span>}
          {c.deadline && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Deadline: {format(new Date(c.deadline), 'MMM d, yyyy')}</span>}
          {c.is_paid && c.compensation && <span className="text-green-600 font-medium">{c.compensation}</span>}
        </div>

        {(c.apply_link || c.apply_email) && !isExpired && (
          <div className="flex gap-2">
            {c.apply_link && (
              <a href={c.apply_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-80 transition-opacity">
                Apply <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {c.apply_email && (
              <a href={`mailto:${c.apply_email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors">
                Email to Apply
              </a>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <button
          onClick={() => { setEditingCollab(null); setShowForm(true); }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" /> Post a Collab Call
        </button>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : collabs.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No collab calls yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Post a call to find models, photographers, stylists & collaborators.</p>}
        </div>
      ) : (
        <div className="space-y-5">
          {open.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Megaphone className="w-3.5 h-3.5" />Open Calls</p>
              <div className="space-y-3">{open.map(c => <CollabCard key={c.id} c={c} />)}</div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Closed</p>
              <div className="space-y-3">{closed.map(c => <CollabCard key={c.id} c={c} />)}</div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <CollabForm artistId={artistId} ownerId={ownerId} collab={editingCollab}
            onClose={() => { setShowForm(false); setEditingCollab(null); }} onSaved={refresh} />
        )}
      </AnimatePresence>
    </div>
  );
}