import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Trash2, Edit2, Loader2, Copy, Crown, Users, Zap, Star, Tag,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, GripVertical, Ticket
} from 'lucide-react';

function TicketIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <path d="M13 5v2M13 17v2M13 11v2"/>
    </svg>
  );
}

const TICKET_GROUPS = [
  { value: 'general', label: 'General Admission', icon: TicketIcon, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { value: 'early_bird', label: 'Early Bird', icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'vip', label: 'VIP', icon: Crown, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'group', label: 'Group', icon: Users, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'free', label: 'Free / RSVP', icon: Star, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'donation', label: 'Donation', icon: Tag, color: 'bg-pink-100 text-pink-700 border-pink-200' },
];

const emptyForm = {
  name: '', description: '', price: '0', quantity_total: '',
  max_per_buyer: '', ticket_type_group: 'general',
  sale_start_date: '', sale_end_date: '', perks: '',
};

export default function OrganizerTicketManager({ event, ticketTypes }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ticket-types', event.id] });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.TicketType.create({
      event_id: event.id,
      name: form.name,
      description: form.description,
      price: form.ticket_type_group === 'free' ? 0 : parseFloat(form.price) || 0,
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
      price: form.ticket_type_group === 'free' ? 0 : parseFloat(form.price) || 0,
      max_per_buyer: form.max_per_buyer ? parseInt(form.max_per_buyer) : null,
      ticket_type_group: form.ticket_type_group,
      sale_start_date: form.sale_start_date || null,
      sale_end_date: form.sale_end_date || null,
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
      name: tt.name,
      description: tt.description || '',
      price: tt.price?.toString() || '0',
      quantity_total: tt.quantity_total?.toString() || '',
      max_per_buyer: tt.max_per_buyer?.toString() || '',
      ticket_type_group: tt.ticket_type_group || 'general',
      sale_start_date: tt.sale_start_date || '',
      sale_end_date: tt.sale_end_date || '',
      perks: (tt.perks || []).join(', '),
    });
    setShowForm(true);
    setExpandedId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity_total) return;
    editingId ? updateMutation.mutate(editingId) : createMutation.mutate();
  };

  const selectedGroup = TICKET_GROUPS.find(g => g.value === form.ticket_type_group) || TICKET_GROUPS[0];

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground text-lg">Ticket Types</h3>
          <p className="text-sm text-muted-foreground">{ticketTypes.length} type{ticketTypes.length !== 1 ? 's' : ''} · Add multiple ticket tiers for your event</p>
        </div>
        {!showForm && (
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Ticket Type
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="bg-card border-2 border-accent/30 rounded-2xl overflow-hidden shadow-sm">
          {/* Form header */}
          <div className="px-6 py-4 bg-accent/5 border-b border-border flex items-center justify-between">
            <h4 className="font-bold text-foreground">{editingId ? 'Edit Ticket Type' : 'New Ticket Type'}</h4>
            <button onClick={resetForm} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Ticket category selector */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Ticket Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TICKET_GROUPS.map(g => {
                  const Icon = g.icon;
                  const isActive = form.ticket_type_group === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, ticket_type_group: g.value, price: g.value === 'free' ? '0' : f.price }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all
                        ${isActive ? 'border-accent bg-accent/10 text-accent shadow-sm' : `border-border hover:border-accent/40 ${g.color} bg-opacity-0 hover:bg-opacity-50`}
                      `}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Ticket Name *</label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="e.g., General Admission, VIP Pass, Early Bird…"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Price {form.ticket_type_group === 'free' ? '(Free)' : '($) *'}
                </label>
                <div className="relative">
                  {form.ticket_type_group !== 'free' && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">$</span>
                  )}
                  <input
                    type="number" step="0.01" min="0"
                    className={`w-full py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent
                      ${form.ticket_type_group !== 'free' ? 'pl-8 pr-4' : 'px-4 opacity-50 cursor-not-allowed'}
                    `}
                    placeholder="0.00"
                    value={form.ticket_type_group === 'free' ? '0' : form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    disabled={form.ticket_type_group === 'free'}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Quantity Available *</label>
                <input
                  type="number" min="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., 100"
                  value={form.quantity_total}
                  onChange={e => setForm(f => ({ ...f, quantity_total: e.target.value }))}
                  required
                  disabled={!!editingId}
                />
                {editingId && <p className="text-xs text-muted-foreground mt-1">Quantity cannot be changed after creation</p>}
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Max Per Buyer</label>
                <input
                  type="number" min="1"
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="No limit"
                  value={form.max_per_buyer}
                  onChange={e => setForm(f => ({ ...f, max_per_buyer: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Sale Starts</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  value={form.sale_start_date}
                  onChange={e => setForm(f => ({ ...f, sale_start_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Sale Ends</label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  value={form.sale_end_date}
                  onChange={e => setForm(f => ({ ...f, sale_end_date: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent h-20"
                  placeholder="What's included? Any restrictions or details…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Perks / Inclusions <span className="normal-case font-normal">(comma-separated)</span></label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                  placeholder="Early Entry, Meet & Greet, Open Bar, Backstage Access…"
                  value={form.perks}
                  onChange={e => setForm(f => ({ ...f, perks: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || !form.name || !form.quantity_total}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-11 rounded-xl font-semibold gap-2"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Save Changes' : 'Create Ticket Type'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="h-11 rounded-xl px-5">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Types List */}
      {ticketTypes.length === 0 && !showForm ? (
        <div className="text-center py-14 bg-card border-2 border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
            <Ticket className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground mb-1">No ticket types yet</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first ticket type to start selling</p>
          <Button onClick={() => setShowForm(true)} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Ticket Type
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {ticketTypes.map(tt => {
            const available = (tt.quantity_total || 0) - (tt.quantity_sold || 0);
            const soldPct = tt.quantity_total > 0 ? ((tt.quantity_sold || 0) / tt.quantity_total) * 100 : 0;
            const group = TICKET_GROUPS.find(g => g.value === tt.ticket_type_group) || TICKET_GROUPS[0];
            const GroupIcon = group.icon;
            const isExpanded = expandedId === tt.id;

            return (
              <div key={tt.id} className={`bg-card border rounded-2xl overflow-hidden transition-all ${!tt.is_active ? 'opacity-60' : ''} ${isExpanded ? 'border-accent/40 shadow-sm' : 'border-border'}`}>
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-4">
                  {/* Category icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${group.color}`}>
                    <GroupIcon className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0" onClick={() => setExpandedId(isExpanded ? null : tt.id)} role="button">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{tt.name}</span>
                      {!tt.is_active && <Badge variant="secondary" className="text-xs">Paused</Badge>}
                      {available === 0 && tt.is_active && <Badge className="text-xs bg-red-100 text-red-700 border-red-200">Sold Out</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-sm font-bold text-accent">{tt.price === 0 ? 'Free' : `$${tt.price}`}</span>
                      <span className="text-xs text-muted-foreground">{tt.quantity_sold || 0} sold · {available} left of {tt.quantity_total}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden w-32">
                      <div
                        className={`h-full rounded-full transition-all ${soldPct > 85 ? 'bg-red-500' : soldPct > 60 ? 'bg-orange-400' : 'bg-accent'}`}
                        style={{ width: `${Math.min(soldPct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleMutation.mutate(tt)}
                      title={tt.is_active ? 'Pause sales' : 'Resume sales'}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      {tt.is_active ? <ToggleRight className="w-5 h-5 text-accent" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                    </button>
                    <button onClick={() => duplicateMutation.mutate(tt)} title="Duplicate" className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(tt)} title="Edit" className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (window.confirm('Delete this ticket type?')) deleteMutation.mutate(tt.id); }}
                      disabled={tt.quantity_sold > 0}
                      title={tt.quantity_sold > 0 ? 'Cannot delete — tickets sold' : 'Delete'}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : tt.id)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-border bg-secondary/30 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <div className="bg-card rounded-xl p-3 text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-0.5">Price</p>
                        <p className="font-bold text-foreground">{tt.price === 0 ? 'Free' : `$${tt.price}`}</p>
                      </div>
                      <div className="bg-card rounded-xl p-3 text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                        <p className="font-bold text-foreground">{tt.quantity_total}</p>
                      </div>
                      <div className="bg-card rounded-xl p-3 text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-0.5">Sold</p>
                        <p className="font-bold text-foreground">{tt.quantity_sold || 0}</p>
                      </div>
                      <div className="bg-card rounded-xl p-3 text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-0.5">Revenue</p>
                        <p className="font-bold text-accent">${((tt.quantity_sold || 0) * (tt.price || 0)).toFixed(2)}</p>
                      </div>
                    </div>
                    {tt.description && <p className="text-sm text-muted-foreground">{tt.description}</p>}
                    {tt.perks?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tt.perks.map(p => <span key={p} className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">✓ {p}</span>)}
                      </div>
                    )}
                    {(tt.sale_start_date || tt.sale_end_date) && (
                      <p className="text-xs text-muted-foreground">
                        Sales: {tt.sale_start_date ? new Date(tt.sale_start_date).toLocaleDateString() : 'Now'} → {tt.sale_end_date ? new Date(tt.sale_end_date).toLocaleDateString() : 'Event date'}
                      </p>
                    )}
                    {tt.max_per_buyer && <p className="text-xs text-muted-foreground">Max {tt.max_per_buyer} per buyer</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add another type shortcut */}
      {ticketTypes.length > 0 && !showForm && (
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
          className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-sm text-muted-foreground hover:border-accent hover:text-accent transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add another ticket type
        </button>
      )}
    </div>
  );
}