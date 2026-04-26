import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function TicketTypeManager({ event, ticketTypes }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    quantity_total: '',
    max_per_buyer: '',
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.TicketType.create({
        event_id: event.id,
        ...form,
        price: parseFloat(form.price),
        quantity_total: parseInt(form.quantity_total),
        max_per_buyer: form.max_per_buyer ? parseInt(form.max_per_buyer) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types', event.id] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (ticketTypeId) =>
      base44.entities.TicketType.update(ticketTypeId, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        max_per_buyer: form.max_per_buyer ? parseInt(form.max_per_buyer) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types', event.id] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ticketTypeId) => base44.entities.TicketType.delete(ticketTypeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-types', event.id] });
    },
  });

  const resetForm = () => {
    setForm({ name: '', description: '', price: '', quantity_total: '', max_per_buyer: '' });
    setEditingId(null);
  };

  const handleEdit = (ticketType) => {
    setEditingId(ticketType.id);
    setForm({
      name: ticketType.name,
      description: ticketType.description || '',
      price: ticketType.price.toString(),
      quantity_total: ticketType.quantity_total.toString(),
      max_per_buyer: ticketType.max_per_buyer?.toString() || '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.quantity_total) return;
    if (editingId) {
      updateMutation.mutate(editingId);
    } else {
      createMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">
          {editingId ? 'Edit Ticket Type' : 'Add Ticket Type'}
        </h3>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
          <input
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g., General Admission"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring h-20"
            placeholder="Optional benefits or details…"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quantity *</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="100"
              value={form.quantity_total}
              onChange={(e) => setForm(f => ({ ...f, quantity_total: e.target.value }))}
              required
              disabled={editingId !== null}
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Max Per Buyer</label>
          <input
            type="number"
            className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Leave blank for no limit"
            value={form.max_per_buyer}
            onChange={(e) => setForm(f => ({ ...f, max_per_buyer: e.target.value }))}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-2"
          >
            {(createMutation.isPending || updateMutation.isPending) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : editingId ? (
              'Update Ticket Type'
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Ticket Type
              </>
            )}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm} className="rounded-lg">
              Cancel
            </Button>
          )}
        </div>
      </form>

      {/* Ticket Types List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">Ticket Types ({ticketTypes.length})</h3>
        {ticketTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No ticket types yet. Create one above!</p>
        ) : (
          <div className="space-y-2">
            {ticketTypes.map(tt => (
              <div key={tt.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{tt.name}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>${tt.price}</span>
                    <span>·</span>
                    <span>{(tt.quantity_total - (tt.quantity_sold || 0))} available</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(tt)}
                    className="text-xs"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm('Delete this ticket type?')) {
                        deleteMutation.mutate(tt.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}