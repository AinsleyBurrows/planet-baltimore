import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMPTY = { name: '', price: '', perks: [], join_url: '' };

function TierForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [perkInput, setPerkInput] = useState('');

  const addPerk = () => {
    if (!perkInput.trim()) return;
    setForm(f => ({ ...f, perks: [...(f.perks || []), perkInput.trim()] }));
    setPerkInput('');
  };

  const removePerk = (idx) => setForm(f => ({ ...f, perks: f.perks.filter((_, i) => i !== idx) }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Tier Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Price (e.g. $50/yr)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Join URL (optional)" value={form.join_url} onChange={e => setForm(f => ({ ...f, join_url: e.target.value }))} />
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Perks</p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm"
            placeholder="Add a perk…"
            value={perkInput}
            onChange={e => setPerkInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPerk()}
          />
          <Button size="sm" variant="outline" onClick={addPerk}>Add</Button>
        </div>
        {(form.perks || []).map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="flex-1">{p}</span>
            <button onClick={() => removePerk(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.name} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function MembershipTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const tiers = org.membership_tiers || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtsOrganization.update(org.id, { membership_tiers: list });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const saveNew = async (form) => {
    setSaving(true);
    await save([...tiers, form]);
    setShowForm(false);
    setSaving(false);
  };

  const saveEdit = async (form) => {
    setSaving(true);
    await save(tiers.map((t, i) => i === editIdx ? { ...t, ...form } : t));
    setEditIdx(null);
    setSaving(false);
  };

  const remove = async (idx) => {
    if (!window.confirm('Remove this tier?')) return;
    await save(tiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Tier
          </Button>
        </div>
      )}
      {showForm && <TierForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {tiers.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No membership tiers yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier, i) => (
            <div key={i}>
              {editIdx === i ? (
                <TierForm initial={tier} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
              ) : (
                <div className="p-4 bg-card border border-border rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{tier.name}</p>
                      {tier.price && <p className="text-sm text-accent font-medium">{tier.price}</p>}
                    </div>
                    {isOwner && (
                      <div className="flex gap-1">
                        <button onClick={() => setEditIdx(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {tier.perks?.length > 0 && (
                    <ul className="space-y-1">
                      {tier.perks.map((p, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-foreground">
                          <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />{p}
                        </li>
                      ))}
                    </ul>
                  )}
                  {tier.join_url && (
                    <a href={tier.join_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                      <ExternalLink className="w-3 h-3" />Join / Donate
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