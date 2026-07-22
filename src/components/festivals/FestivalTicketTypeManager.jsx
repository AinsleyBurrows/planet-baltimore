import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit, Loader2, Ticket, ChevronUp, ChevronDown } from 'lucide-react';

const EMPTY = { name: '', description: '', price: '', quantity_total: '', max_per_buyer: '' };

export default function FestivalTicketTypeManager({ festivalId }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const queryKey = ['festival-ticket-types', festivalId];

  const { data: ticketTypes = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities.TicketType.filter({ festival_id: festivalId }, 'sort_order', 200),
    enabled: !!festivalId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.TicketType.create({
        festival_id: festivalId,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        quantity_total: parseInt(form.quantity_total, 10),
        max_per_buyer: form.max_per_buyer ? parseInt(form.max_per_buyer, 10) : null,
        sort_order: ticketTypes.length,
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      base44.entities.TicketType.update(editingId, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        max_per_buyer: form.max_per_buyer ? parseInt(form.max_per_buyer, 10) : null,
      }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TicketType.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reorderMutation = useMutation({
    mutationFn: (updates) => base44.entities.TicketType.bulkUpdate(updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const move = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= ticketTypes.length) return;
    const arr = [...ticketTypes];
    [arr[index], arr[target]] = [arr[target], arr[index]];
    const updates = arr.map((t, i) => ({ id: t.id, sort_order: i }));
    queryClient.setQueryData(queryKey, arr);
    reorderMutation.mutate(updates);
  };

  const resetForm = () => { setForm(EMPTY); setEditingId(null); };

  const handleEdit = (tt) => {
    setEditingId(tt.id);
    setForm({
      name: tt.name || '',
      description: tt.description || '',
      price: String(tt.price ?? ''),
      quantity_total: String(tt.quantity_total ?? ''),
      max_per_buyer: tt.max_per_buyer ? String(tt.max_per_buyer) : '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || form.quantity_total === '') return;
    if (editingId) updateMutation.mutate();
    else createMutation.mutate();
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      <div className="flex items-center gap-2">
        <Ticket className="w-4 h-4 text-[#d4580a]" />
        <p className="text-sm font-semibold text-foreground">Ticket Types</p>
        <span className="text-xs text-muted-foreground">— uses the platform's ticketing format</span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="border border-border rounded-lg p-3 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">{editingId ? 'Edit ticket type' : 'Add a ticket type'}</p>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
          <input className={inputCls} placeholder="e.g., General Admission, VIP, Early Bird" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea className={`${inputCls} resize-none h-16`} placeholder="Optional benefits or details…" value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Price ($) *</label>
            <input type="number" step="0.01" min="0" className={inputCls} placeholder="0.00" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Quantity *</label>
            <input type="number" min="0" className={inputCls} placeholder="100" value={form.quantity_total} onChange={(e) => setForm(f => ({ ...f, quantity_total: e.target.value }))} required disabled={editingId !== null} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Max / buyer</label>
            <input type="number" min="1" className={inputCls} placeholder="No limit" value={form.max_per_buyer} onChange={(e) => setForm(f => ({ ...f, max_per_buyer: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="text-white rounded-lg gap-1.5" style={{ backgroundColor: '#d4580a' }}>
            {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? 'Update' : 'Add Ticket Type'}
          </Button>
          {editingId && <Button type="button" variant="outline" onClick={resetForm} className="rounded-lg">Cancel</Button>}
        </div>
      </form>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-muted border-t-[#d4580a] rounded-full animate-spin" /></div>
      ) : ticketTypes.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No ticket types yet. Add one above to enable platform ticketing.</p>
      ) : (
        <div className="space-y-2">
          {ticketTypes.map((tt, idx) => (
            <div key={tt.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{tt.name}</p>
                <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>${tt.price}</span><span>·</span>
                  <span>{(tt.quantity_total - (tt.quantity_sold || 0))} of {tt.quantity_total} left</span>
                  {tt.max_per_buyer && <><span>·</span><span>max {tt.max_per_buyer}/buyer</span></>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0} className="h-8 w-8 p-0"><ChevronUp className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === ticketTypes.length - 1} className="h-8 w-8 p-0"><ChevronDown className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(tt)} className="h-8 w-8 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => { if (window.confirm('Delete this ticket type?')) deleteMutation.mutate(tt.id); }} disabled={deleteMutation.isPending} className="h-8 w-8 p-0 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}