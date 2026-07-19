import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function TierForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', description: '', price: '', billing_period: 'monthly', perks: [''], accent_color: '' });
  const setPerk = (i, v) => setForm(f => ({ ...f, perks: f.perks.map((p, idx) => idx === i ? v : p) }));
  const addPerk = () => setForm(f => ({ ...f, perks: [...f.perks, ''] }));
  const removePerk = (i) => setForm(f => ({ ...f, perks: f.perks.filter((_, idx) => idx !== i) }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Tier name (e.g. 'Reader') *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="What members get (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div className="flex gap-2">
        <input className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Price" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value === '' ? '' : Number(e.target.value) }))} />
        <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.billing_period} onChange={e => setForm(f => ({ ...f, billing_period: e.target.value }))}>
          <option value="monthly">per month</option>
          <option value="yearly">per year</option>
        </select>
        <input className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Accent #hex" value={form.accent_color} onChange={e => setForm(f => ({ ...f, accent_color: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">Perks</p>
        {form.perks.map((perk, i) => (
          <div key={i} className="flex gap-2">
            <input className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm" placeholder={`Perk ${i + 1}`} value={perk} onChange={e => setPerk(i, e.target.value)} />
            <button onClick={() => removePerk(i)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={addPerk} className="text-xs text-accent hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add perk</button>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...form, perks: form.perks.filter(Boolean) })} disabled={!form.name || form.price === ''} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function TierCard({ tier, isOwner, onEdit, onDelete }) {
  const accent = tier.accent_color || '#d4580a';
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col" style={{ borderTopColor: accent, borderTopWidth: 3 }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-foreground">{tier.name}</p>
          <p className="text-2xl font-bold text-foreground mt-1">${Number(tier.price).toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/{tier.billing_period === 'monthly' ? 'mo' : 'yr'}</span></p>
        </div>
        {isOwner && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )}
      </div>
      {tier.description && <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>}
      {tier.perks?.length > 0 && (
        <ul className="mt-3 space-y-1.5 flex-1">
          {tier.perks.map((p, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><Heart className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: accent }} />{p}</li>)}
        </ul>
      )}
      {!isOwner && <Button size="sm" className="mt-4 w-full text-accent-foreground" style={{ background: accent }}>{tier.billing_period === 'monthly' ? 'Join' : 'Subscribe'}</Button>}
      {tier.subscriber_count > 0 && <p className="text-[10px] text-muted-foreground text-center mt-2">{tier.subscriber_count} member{tier.subscriber_count === 1 ? '' : 's'}</p>}
    </div>
  );
}

export default function MembershipTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['membership-tiers', artistId],
    queryFn: () => base44.entities.MembershipTier.filter({ artist_id: artistId }, 'sort_order', 20),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['membership-tiers', artistId] });
  const saveNew = async (form) => { await base44.entities.MembershipTier.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.MembershipTier.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (tier) => { if (!window.confirm('Remove this tier?')) return; await base44.entities.MembershipTier.delete(tier.id); refresh(); };

  if (isLoading) return <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Tier</Button>
        </div>
      )}
      {showForm && <TierForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {tiers.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No membership tiers yet.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{tiers.map(t => editing?.id === t.id ? <TierForm key={t.id} initial={t} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <TierCard key={t.id} tier={t} isOwner={isOwner} onEdit={() => setEditing(t)} onDelete={() => del(t)} />)}</div>}
    </div>
  );
}