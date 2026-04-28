import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Globe, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TIERS = ['Presenting Sponsor', 'Major Funder', 'Partner', 'Sponsor', 'In-Kind', 'Media Partner', 'Government', 'Foundation'];
const empty = { name: '', tier: 'Partner', logo_url: '', website: '', description: '' };

export default function SponsorsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const sponsors = org.sponsors || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  const save = async () => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { sponsors: [...sponsors, { ...form }] });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm(empty);
    setSaving(false);
  };

  const remove = async (idx) => {
    await base44.entities.ArtsOrganization.update(org.id, { sponsors: sponsors.filter((_, i) => i !== idx) });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  // Group by tier
  const grouped = TIERS.reduce((acc, tier) => {
    const items = sponsors.filter(s => s.tier === tier);
    if (items.length > 0) acc[tier] = items;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Sponsor / Partner
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Organization Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
              {TIERS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Logo URL (optional)" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Website URL (optional)" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Short description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.name} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {sponsors.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No sponsors or partners listed yet.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([tier, items]) => (
            <div key={tier}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{tier}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map((sponsor, i) => {
                  const globalIdx = sponsors.findIndex(s => s === sponsor);
                  return (
                    <div key={i} className="relative group bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt={sponsor.name} className="h-12 object-contain" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-lg font-bold text-muted-foreground">{sponsor.name?.charAt(0)}</div>
                      )}
                      <p className="font-semibold text-foreground text-sm">{sponsor.name}</p>
                      {sponsor.description && <p className="text-xs text-muted-foreground">{sponsor.description}</p>}
                      {sponsor.website && (
                        <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                          <Globe className="w-3 h-3" />Visit
                        </a>
                      )}
                      {isOwner && (
                        <button onClick={() => remove(globalIdx)} className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}