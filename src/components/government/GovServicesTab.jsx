import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, ExternalLink, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Permits & Licenses', 'Public Health', 'Sanitation & Waste', 'Transportation', 'Housing', 'Public Safety', 'Parks & Recreation', 'Community Services', 'Business Services', 'Other'];
const STATUSES = [
  { value: 'active', label: 'Active', badge: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'Closed', badge: 'bg-red-100 text-red-700' },
  { value: 'seasonal', label: 'Seasonal', badge: 'bg-amber-100 text-amber-700' },
];
const EMPTY = { title: '', description: '', category: 'Permits & Licenses', url: '', status: 'active' };

export default function GovServicesTab({ agency, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const services = agency.services || [];

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (idx) => { setForm(services[idx]); setEditing(idx); setShowForm(true); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const next = [...services];
    if (editing !== null) next[editing] = form;
    else next.push(form);
    await base44.entities.GovernmentAgency.update(agency.id, { services: next });
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  const remove = async (idx) => {
    if (!window.confirm('Remove this service?')) return;
    const next = services.filter((_, i) => i !== idx);
    await base44.entities.GovernmentAgency.update(agency.id, { services: next });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openNew} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Service</Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">{editing !== null ? 'Edit Service' : 'New Service'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Service title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description / how to use this service" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link to apply / report (https://…)" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={!form.title.trim() || saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {services.length === 0 && !showForm ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No services listed yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((s, idx) => {
            const status = STATUSES.find(st => st.value === s.status);
            return (
              <div key={idx} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{s.title}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{s.category}</span>
                  </div>
                  {isOwner && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(idx)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => remove(idx)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                {s.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{s.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${status?.badge || 'bg-secondary text-muted-foreground'}`}>{status?.label || s.status}</span>
                  {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline font-medium flex items-center gap-1">Apply <ExternalLink className="w-3 h-3" /></a>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}