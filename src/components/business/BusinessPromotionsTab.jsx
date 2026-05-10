import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Zap, Plus, Trash2, X, Loader2, Clock, Tag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

function PromoForm({ onSave, onCancel, saving }) {
  const [form, setForm] = useState({ title: '', description: '', discount: '', expires_at: '', claim_limit: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Promotion title * (e.g. Happy Hour Special)"
        value={form.title}
        onChange={e => set('title', e.target.value)}
      />
      <textarea
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        rows={2}
        placeholder="Details (e.g. 20% off all drinks, dine-in only)"
        value={form.description}
        onChange={e => set('description', e.target.value)}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Discount / Deal Label</label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. 20% OFF or BOGO"
            value={form.discount}
            onChange={e => set('discount', e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Expires at</label>
          <input
            type="datetime-local"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            value={form.expires_at}
            onChange={e => set('expires_at', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Claim limit (leave blank for unlimited)</label>
        <input
          type="number"
          min="1"
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="e.g. 50"
          value={form.claim_limit}
          onChange={e => set('claim_limit', e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : 'Post Promotion'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function PromoCard({ promo, isOwner, onDelete, onClaim, claimed }) {
  const expired = promo.expires_at && isPast(parseISO(promo.expires_at));
  const atLimit = promo.claim_limit && (promo.claims_count || 0) >= Number(promo.claim_limit);
  const canClaim = !expired && !atLimit && !claimed;

  return (
    <div className={`relative rounded-xl border p-4 space-y-2 transition-all ${expired ? 'opacity-60 border-border' : 'border-accent/30 bg-accent/5'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Zap className={`w-4 h-4 mt-0.5 flex-shrink-0 ${expired ? 'text-muted-foreground' : 'text-accent'}`} />
          <div>
            <p className="font-semibold text-sm text-foreground">{promo.title}</p>
            {promo.description && <p className="text-xs text-muted-foreground mt-0.5">{promo.description}</p>}
          </div>
        </div>
        {isOwner && (
          <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2">
        {promo.discount && (
          <Badge className="bg-accent/20 text-accent border-accent/30 gap-1 text-xs">
            <Tag className="w-3 h-3" />{promo.discount}
          </Badge>
        )}
        {promo.expires_at && (
          <span className={`flex items-center gap-1 text-xs ${expired ? 'text-destructive' : 'text-muted-foreground'}`}>
            <Clock className="w-3 h-3" />
            {expired ? 'Expired' : `Ends ${formatDistanceToNow(parseISO(promo.expires_at), { addSuffix: true })}`}
          </span>
        )}
        {promo.claim_limit && (
          <span className="text-xs text-muted-foreground">
            {promo.claims_count || 0} / {promo.claim_limit} claimed
          </span>
        )}
      </div>

      {/* CTA */}
      {!isOwner && (
        <div className="pt-1">
          {claimed ? (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> You claimed this deal!
            </div>
          ) : expired || atLimit ? (
            <p className="text-xs text-muted-foreground">{expired ? 'This promotion has ended.' : 'No more claims available.'}</p>
          ) : (
            <Button size="sm" onClick={onClaim} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Claim Deal
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function BusinessPromotionsTab({ business, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  // Track which promos the current user has claimed (stored in sessionStorage for simplicity)
  const storageKey = `claimed_promos_${business.id}`;
  const [claimed, setClaimed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });

  const promotions = business.hub_data?.promotions || [];

  const persist = async (promos) => {
    await base44.entities.BusinessPage.update(business.id, {
      hub_data: { ...(business.hub_data || {}), promotions: promos }
    });
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
  };

  const handleSave = async (form) => {
    setSaving(true);
    const newPromo = {
      ...form,
      id: Date.now().toString(),
      claims_count: 0,
      created_at: new Date().toISOString(),
    };
    await persist([...promotions, newPromo]);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (promoId) => {
    if (!window.confirm('Remove this promotion?')) return;
    await persist(promotions.filter(p => p.id !== promoId));
  };

  const handleClaim = async (promo) => {
    const updated = promotions.map(p =>
      p.id === promo.id ? { ...p, claims_count: (p.claims_count || 0) + 1 } : p
    );
    await persist(updated);
    const newClaimed = [...claimed, promo.id];
    setClaimed(newClaimed);
    sessionStorage.setItem(storageKey, JSON.stringify(newClaimed));
  };

  const active = promotions.filter(p => !p.expires_at || !isPast(parseISO(p.expires_at)));
  const expired = promotions.filter(p => p.expires_at && isPast(parseISO(p.expires_at)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-accent" /> Promotions & Flash Sales
        </h3>
        {isOwner && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Promotion
          </Button>
        )}
      </div>

      {showForm && <PromoForm onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} />}

      {active.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-10 bg-secondary/30 rounded-xl">
          {isOwner ? 'No active promotions. Add one to attract followers!' : 'No active promotions right now. Check back soon!'}
        </p>
      ) : (
        <div className="space-y-3">
          {active.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              isOwner={isOwner}
              onDelete={() => handleDelete(promo.id)}
              onClaim={() => handleClaim(promo)}
              claimed={claimed.includes(promo.id)}
            />
          ))}
        </div>
      )}

      {expired.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past Promotions</p>
          {expired.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              isOwner={isOwner}
              onDelete={() => handleDelete(promo.id)}
              onClaim={() => {}}
              claimed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}