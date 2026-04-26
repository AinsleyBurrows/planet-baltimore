import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PromotorManager({ event, promoters }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    promoter_email: '',
    promoter_name: '',
    commission_rate: '5',
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // In a real app, invite the promoter and create the record
      await base44.entities.Promoter.create({
        event_id: event.id,
        producer_id: event.organizer_id,
        promoter_id: '', // Will be filled when they accept invite
        promoter_name: form.promoter_name,
        promoter_email: form.promoter_email,
        commission_rate: parseFloat(form.commission_rate),
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-promoters', event.id] });
      setForm({ promoter_email: '', promoter_name: '', commission_rate: '5' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (promoterId) =>
      base44.entities.Promoter.update(promoterId, { status: 'removed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-promoters', event.id] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.promoter_email || !form.promoter_name || !form.commission_rate) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Add Promoter Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Invite Promoter</h3>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Promoter name"
            value={form.promoter_name}
            onChange={(e) => setForm(f => ({ ...f, promoter_name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="promoter@example.com"
            value={form.promoter_email}
            onChange={(e) => setForm(f => ({ ...f, promoter_email: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Commission Rate (%) *</label>
          <input
            type="number"
            step="0.5"
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="5"
            value={form.commission_rate}
            onChange={(e) => setForm(f => ({ ...f, commission_rate: e.target.value }))}
            required
          />
        </div>

        <Button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-2"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Inviting...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Promoter
            </>
          )}
        </Button>
      </form>

      {/* Promoters List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Active Promoters ({promoters.length})</h3>
        {promoters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No promoters yet. Invite one above!</p>
        ) : (
          <div className="space-y-2">
            {promoters.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{p.promoter_name}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{p.promoter_email}</span>
                    <span>·</span>
                    <Badge variant="secondary">{p.commission_rate}% commission</Badge>
                    <span>·</span>
                    <span>{p.total_tickets_sold || 0} sold</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm('Remove this promoter?')) {
                      removeMutation.mutate(p.id);
                    }
                  }}
                  disabled={removeMutation.isPending}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}