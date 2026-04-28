import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Loader2, Link2, Copy, DollarSign, BarChart3, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function OrganizerPromoterManager({ event, promoters, orders }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ promoter_email: '', promoter_name: '', commission_rate: '10', commission_type: 'percentage' });
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['event-promoters', event.id] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const promo = await base44.entities.Promoter.create({
        event_id: event.id,
        producer_id: event.organizer_id,
        promoter_id: '',
        promoter_name: form.promoter_name,
        promoter_email: form.promoter_email,
        commission_rate: parseFloat(form.commission_rate),
        status: 'active',
      });
      // Send invite email
      await base44.integrations.Core.SendEmail({
        to: form.promoter_email,
        subject: `You've been invited to promote: ${event.title}`,
        body: `Hi ${form.promoter_name},\n\nYou've been invited as a sub-promoter for "${event.title}".\n\nYour commission rate: ${form.commission_rate}%\n\nShare your unique promoter link to track ticket sales:\n${window.location.origin}/events/${event.id}/tickets?promoter=${promo.id}\n\nBest,\nPlanet Baltimore`,
      });
      return promo;
    },
    onSuccess: () => { invalidate(); setShowForm(false); setForm({ promoter_email: '', promoter_name: '', commission_rate: '10', commission_type: 'percentage' }); toast({ title: 'Promoter added & invited!' }); },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.Promoter.update(id, { status: 'removed' }),
    onSuccess: invalidate,
  });

  const reactivateMutation = useMutation({
    mutationFn: (id) => base44.entities.Promoter.update(id, { status: 'active' }),
    onSuccess: invalidate,
  });

  const copyLink = (promoter) => {
    const link = `${window.location.origin}/events/${event.id}/tickets?promoter=${promoter.id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(promoter.id);
    toast({ title: 'Link copied!', description: 'Share this link with the promoter.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calculate earnings per promoter from orders
  const getPromoterStats = (promoter) => {
    const promoOrders = orders.filter(o => o.promo_code_used === promoter.id || o.promoter_id === promoter.id);
    const totalSales = promoOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const commission = totalSales * (promoter.commission_rate / 100);
    return { orders: promoOrders.length, tickets: promoOrders.reduce((s, o) => s + (o.quantity || 0), 0), sales: totalSales, commission };
  };

  const activePromoters = promoters.filter(p => p.status !== 'removed');
  const removedPromoters = promoters.filter(p => p.status === 'removed');
  const totalPromoterSales = promoters.reduce((s, p) => s + (p.total_tickets_sold || 0), 0);
  const totalPromoterCommission = promoters.reduce((s, p) => s + (p.total_commission_earned || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      {promoters.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{activePromoters.length}</p>
            <p className="text-xs text-muted-foreground">Active Promoters</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-foreground">{promoters.reduce((s, p) => s + (p.total_tickets_sold || 0), 0)}</p>
            <p className="text-xs text-muted-foreground">Tickets via Promo</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-accent">${totalPromoterCommission.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Commissions</p>
          </div>
        </div>
      )}

      {/* Add Promoter */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Plus className="w-4 h-4" /> Add Sub-Promoter
        </Button>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Invite Sub-Promoter</h3>
          <p className="text-xs text-muted-foreground">They'll receive an email with their unique referral link. Commission is calculated on ticket subtotal (excl. platform fees).</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Full Name *</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Jane Smith" value={form.promoter_name} onChange={e => setForm(f => ({ ...f, promoter_name: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
              <input type="email" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="jane@example.com" value={form.promoter_email} onChange={e => setForm(f => ({ ...f, promoter_email: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Commission Rate (%) *</label>
              <input type="number" step="0.5" min="0" max="50" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="10" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} required />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg w-full">
                Promoter earns <strong>{form.commission_rate}%</strong> of every ticket sale made through their link.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add & Send Invite
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Active Promoters */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Active Promoters ({activePromoters.length})</h3>
        {activePromoters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 bg-secondary/30 rounded-xl">No promoters yet. Add one above to start tracking referral sales.</p>
        ) : (
          activePromoters.map(p => {
            const stats = getPromoterStats(p);
            const link = `${window.location.origin}/events/${event.id}/tickets?promoter=${p.id}`;
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-foreground">{p.promoter_name}</p>
                      <Badge variant="secondary" className="text-xs">{p.commission_rate}% commission</Badge>
                      <Badge variant="outline" className={`text-xs ${p.status === 'active' ? 'text-green-700 bg-green-50 border-green-200' : 'text-muted-foreground'}`}>{p.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{p.promoter_email}</p>
                    <div className="grid grid-cols-3 gap-2 text-center mb-3">
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-sm font-bold text-foreground">{p.total_tickets_sold || 0}</p>
                        <p className="text-[10px] text-muted-foreground">Tickets</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-sm font-bold text-foreground">${(p.total_commission_earned || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Earned</p>
                      </div>
                      <div className="bg-secondary/40 rounded-lg p-2">
                        <p className="text-sm font-bold text-foreground">${((p.total_commission_earned || 0) / Math.max((p.commission_rate / 100), 0.01)).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Sales</p>
                      </div>
                    </div>
                    {/* Referral Link */}
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                      <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{link.replace('https://', '')}</span>
                      <button onClick={() => copyLink(p)} className="text-xs text-accent hover:text-accent/80 font-medium flex-shrink-0 flex items-center gap-1">
                        {copiedId === p.id ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { if (window.confirm('Remove this promoter?')) removeMutation.mutate(p.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Removed Promoters */}
      {removedPromoters.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-muted-foreground text-sm">Removed ({removedPromoters.length})</h3>
          {removedPromoters.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg opacity-60">
              <div>
                <p className="text-sm font-medium text-foreground">{p.promoter_name}</p>
                <p className="text-xs text-muted-foreground">{p.promoter_email}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => reactivateMutation.mutate(p.id)} className="text-xs">Reactivate</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}