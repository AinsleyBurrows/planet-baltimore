import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Loader2, ToggleLeft, ToggleRight, Copy, Star, Crown, Users, Zap, Tag } from 'lucide-react';

const TICKET_GROUPS = [
  { value: 'general', label: 'General Admission', icon: Ticket2 },
  { value: 'early_bird', label: 'Early Bird', icon: Zap },
  { value: 'vip', label: 'VIP', icon: Crown },
  { value: 'group', label: 'Group', icon: Users },
  { value: 'free', label: 'Free / RSVP', icon: Star },
  { value: 'donation', label: 'Donation', icon: Tag },
];

function Ticket2(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>; }

const emptyForm = {
  name: '', description: '', price: '', quantity_total: '',
  max_per_buyer: '', ticket_type_group: 'general',
  sale_start_date: '', sale_end_date: '', perks: '',
};

const GROUP_COLORS = {
  vip: 'bg-purple-50 border-purple-200 text-purple-700',
  early_bird: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  free: 'bg-green-50 border-green-200 text-green-700',
  group: 'bg-blue-50 border-blue-200 text-blue-700',
  donation: 'bg-pink-50 border-pink-200 text-pink-700',
  general: 'bg-secondary border-border text-foreground',
};

export default function OrganizerTicketManager({ event, ticketTypes }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ticket-types', event.id] });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.TicketType.create({
      event_id: event.id,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      quantity_total: parseInt(form.quantity_total),
      max_per_buyer: form.max_per_buyer ? parseInt(form.max_per_buyer) : null,
      ticket_type_group: form.ticket_type_group,
      sale_start_date: form.sale_start_date || null,
      sale_end_date: form.sale_end_date || null,
      perks: form.perks ? form.perks.split(',').map(p => p.trim()).filter(Boolean) : [],
      is_active: true,
      sort_order: ticketTypes.length,
    }),
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: (id) => base44.entities.TicketType.update(id, {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      max_per_buyer: form.max_per_buyer ? parseInt(form.max_per_buyer) : null,
      ticket_type_group: form.ticket_type_group,
      perks: form.perks ? form.perks.split(',').map(p => p.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const toggleMutation = useMutation({
    mutationFn: (tt) => base44.entities.TicketType.update(tt.id, { is_active: !tt.is_active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TicketType.delete(id),
    onSuccess: invalidate,
  });

  const duplicateMutation = useMutation({
    mutationFn: (tt) => base44.entities.TicketType.create({
      ...tt, id: undefined, name: `${tt.name} (Copy)`,
      quantity_sold: 0, sort_order: ticketTypes.length,
    }),
    onSuccess: invalidate,
  });

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };
  const handleEdit = (tt) => {
    setEditingId(tt.id);
    setForm({
      name: tt.name, description: tt.description || '',
      price: tt.price?.toString() || '0', quantity_total: tt.quantity_total?.toString() || '',
      max_per_buyer: tt.max_per_buyer?.toString() || '',
      ticket_type_group: tt.ticket_type_group || 'general',
      sale_start_date: tt.sale_start_date || '', sale_end_date: tt.sale_end_date || '',
      perks: (tt.perks || []).join(', '),
    });
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity_total) return;
    editingId ? updateMutation.mutate(editingId) : createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Add Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Plus className="w-4 h-4" /> Add Ticket Type
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">{editingId ? 'Edit Ticket Type' : 'New Ticket Type'}</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TICKET_GROUPS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, ticket_type_group: g.value, price: g.value === 'free' ? '0' : f.price }))}
                className={`p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  form.ticket_type_group === g.value ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-accent/50'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Ticket Name *</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="e.g., General Admission" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Price ($) *</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} disabled={form.ticket_type_group === 'free'} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Quantity *</label>
              <input type="number" min="1" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="100" value={form.quantity_total} onChange={e => setForm(f => ({ ...f, quantity_total: e.target.value }))} required disabled={!!editingId} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Per Buyer</label>
              <input type="number" min="1" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="No limit" value={form.max_per_buyer} onChange={e => setForm(f => ({ ...f, max_per_buyer: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sale Start</label>
              <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.sale_start_date} onChange={e => setForm(f => ({ ...f, sale_start_date: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Sale End</label>
              <input type="datetime-local" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.sale_end_date} onChange={e => setForm(f => ({ ...f, sale_end_date: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring h-16" placeholder="Optional details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Perks (comma-separated)</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Early Entry, Meet & Greet, Open Bar..." value={form.perks} onChange={e => setForm(f => ({ ...f, perks: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingId ? 'Update' : 'Create Ticket Type'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Ticket Types List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Ticket Types ({ticketTypes.length})</h3>
        {ticketTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 bg-secondary/30 rounded-xl">No ticket types yet. Add one above!</p>
        ) : (
          <div className="space-y-2">
            {ticketTypes.map(tt => {
              const available = (tt.quantity_total || 0) - (tt.quantity_sold || 0);
              const soldPct = tt.quantity_total > 0 ? ((tt.quantity_sold || 0) / tt.quantity_total) * 100 : 0;
              const colorClass = GROUP_COLORS[tt.ticket_type_group] || GROUP_COLORS.general;
              return (
                <div key={tt.id} className={`p-4 rounded-xl border ${!tt.is_active ? 'opacity-60' : ''} bg-card border-border`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-foreground">{tt.name}</p>
                        <Badge variant="outline" className={`text-xs ${colorClass}`}>{tt.ticket_type_group?.replace('_', ' ')}</Badge>
                        {!tt.is_active && <Badge variant="secondary" className="text-xs">Paused</Badge>}
                        {available === 0 && tt.is_active && <Badge className="text-xs bg-red-100 text-red-700 border-red-200">Sold Out</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{tt.price === 0 ? 'Free' : `$${tt.price}`}</span>
                        <span>{tt.quantity_sold || 0} sold / {tt.quantity_total} total</span>
                        <span>{available} remaining</span>
                      </div>
                      {tt.perks?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tt.perks.map(p => <span key={p} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">{p}</span>)}
                        </div>
                      )}
                      <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${Math.min(soldPct, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => toggleMutation.mutate(tt)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={tt.is_active ? 'Pause sales' : 'Resume sales'}>
                        {tt.is_active ? <ToggleRight className="w-4 h-4 text-accent" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => duplicateMutation.mutate(tt)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Duplicate">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEdit(tt)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this ticket type?')) deleteMutation.mutate(tt.id); }} disabled={tt.quantity_sold > 0} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30" title={tt.quantity_sold > 0 ? 'Cannot delete — tickets already sold' : 'Delete'}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}