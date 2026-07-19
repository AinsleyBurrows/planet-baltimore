import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Handshake, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const EMPTY = { title: '', description: '', price_from: '', duration_label: '', includes: [] };

function CommissionForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);

  const addInclude = () => setForm(f => ({ ...f, includes: [...f.includes, ''] }));
  const updateInclude = (idx, val) => setForm(f => ({ ...f, includes: f.includes.map((x, i) => (i === idx ? val : x)) }));
  const removeInclude = (idx) => setForm(f => ({ ...f, includes: f.includes.filter((_, i) => i !== idx) }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Commission type (e.g. Custom Collage Portrait) *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y min-h-[72px]" placeholder="What you'll create, sizes, materials, turnaround" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Starting price ($)" type="number" min="0" value={form.price_from} onChange={e => setForm(f => ({ ...f, price_from: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Turnaround (e.g. 3–4 weeks)" value={form.duration_label} onChange={e => setForm(f => ({ ...f, duration_label: e.target.value }))} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1.5">What's included</p>
        <div className="space-y-2">
          {form.includes.map((inc, i) => (
            <div key={i} className="flex gap-2">
              <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="e.g. 1 framed piece, 2 rounds of revisions" value={inc} onChange={e => updateInclude(i, e.target.value)} />
              <button onClick={() => removeInclude(i)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ))}
          <button onClick={addInclude} className="text-xs text-accent hover:underline font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add item</button>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...form, price_from: form.price_from ? Number(form.price_from) : null })} disabled={saving || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function MixedMediaCommissionsTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['mixed-media-commissions', artistId],
    queryFn: () => base44.entities.PhotoSession.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['mixed-media-commissions', artistId] });
  const saveNew = async (form) => {
    setSaving(true);
    await base44.entities.PhotoSession.create({ ...form, artist_id: artistId });
    setShowForm(false);
    setSaving(false);
    refresh();
  };
  const remove = async (item) => {
    if (!window.confirm('Remove this commission type?')) return;
    await base44.entities.PhotoSession.delete(item.id);
    refresh();
  };

  if (isLoading) return <div className="grid sm:grid-cols-2 gap-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
        <Handshake className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Commission custom mixed-media work directly from the artist. Browse the options below, then use the Contact tab to request a piece.</p>
      </div>
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Commission Type
          </Button>
        </div>
      )}
      {showForm && <CommissionForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Handshake className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No commission options listed yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(it => (
            <div key={it.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-foreground">{it.title}</p>
                {isOwner && (
                  <button onClick={() => remove(it)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {it.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{it.description}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                {it.price_from != null && <span className="font-semibold text-foreground">From ${it.price_from.toLocaleString()}</span>}
                {it.duration_label && <span>⏱ {it.duration_label}</span>}
              </div>
              {it.includes?.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {it.includes.map((inc, i) => inc && (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-accent">•</span> {inc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}