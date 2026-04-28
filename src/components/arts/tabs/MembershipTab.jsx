import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Heart, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MembershipTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const tiers = org.membership_tiers || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [perkInput, setPerkInput] = useState('');
  const [form, setForm] = useState({ name: '', price: '', perks: [], join_url: '' });

  const addPerk = () => {
    if (perkInput.trim()) { setForm(f => ({ ...f, perks: [...f.perks, perkInput.trim()] })); setPerkInput(''); }
  };

  const save = async () => {
    setSaving(true);
    const updated = [...tiers, { ...form }];
    await base44.entities.ArtsOrganization.update(org.id, { membership_tiers: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm({ name: '', price: '', perks: [], join_url: '' });
    setSaving(false);
  };

  const remove = async (idx) => {
    const updated = tiers.filter((_, i) => i !== idx);
    await base44.entities.ArtsOrganization.update(org.id, { membership_tiers: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Tier
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Tier Name (e.g. Friend, Patron) *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Price (e.g. $50/year or Free)" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Sign-up / Donate URL (optional)" value={form.join_url} onChange={e => setForm(f => ({ ...f, join_url: e.target.value }))} />
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Perks</p>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Add a perk…" value={perkInput} onChange={e => setPerkInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPerk())} />
              <Button size="sm" variant="outline" onClick={addPerk}>Add</Button>
            </div>
            {form.perks.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm mb-1">
                <Check className="w-3.5 h-3.5 text-accent" />{p}
                <button onClick={() => setForm(f => ({ ...f, perks: f.perks.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-destructive ml-auto text-xs">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.name} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {tiers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Heart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No membership tiers yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier, i) => (
            <div key={i} className="bg-card border-2 border-border rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{tier.name}</h3>
                  {tier.price && <p className="text-accent font-semibold text-sm">{tier.price}</p>}
                </div>
                {isOwner && (
                  <button onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {tier.perks?.length > 0 && (
                <ul className="flex-1 space-y-1.5 mt-2 mb-4">
                  {tier.perks.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />{p}
                    </li>
                  ))}
                </ul>
              )}
              {tier.join_url && (
                <a href={tier.join_url} target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/90 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Join / Support
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}