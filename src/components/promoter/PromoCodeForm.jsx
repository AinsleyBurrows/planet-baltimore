import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function PromoCodeForm({ eventId, promo, onClose, onSaved }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    usage_limit: '',
    min_purchase_qty: '',
    valid_from: '',
    valid_until: '',
    is_active: true,
  });

  useEffect(() => {
    if (promo) {
      setFormData({
        code: promo.code || '',
        discount_type: promo.discount_type || 'percentage',
        discount_value: promo.discount_value || 10,
        usage_limit: promo.usage_limit || '',
        min_purchase_qty: promo.min_purchase_qty || '',
        valid_from: promo.valid_from ? promo.valid_from.split('T')[0] : '',
        valid_until: promo.valid_until ? promo.valid_until.split('T')[0] : '',
        is_active: promo.is_active ?? true,
      });
    }
  }, [promo]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (promo) {
        return base44.entities.PromoCode.update(promo.id, data);
      } else {
        return base44.entities.PromoCode.create({ ...data, event_id: eventId });
      }
    },
    onSuccess: () => onSaved(),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card rounded-t-2xl sm:rounded-t-2xl">
          <h3 className="font-semibold text-foreground">{promo ? 'Edit Code' : 'Create Promo Code'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-foreground">Code</label>
            <input
              type="text"
              value={formData.code}
              onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g., EARLY20"
              disabled={!!promo}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Type</label>
              <select
                value={formData.discount_type}
                onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Discount Value</label>
              <input
                type="number"
                value={formData.discount_value}
                onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Usage Limit (optional)</label>
            <input
              type="number"
              value={formData.usage_limit}
              onChange={e => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : '' })}
              placeholder="Leave blank for unlimited"
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              min="1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Minimum Purchase (tickets, optional)</label>
            <input
              type="number"
              value={formData.min_purchase_qty}
              onChange={e => setFormData({ ...formData, min_purchase_qty: e.target.value ? parseInt(e.target.value) : '' })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              min="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Valid From (optional)</label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={e => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Valid Until (optional)</label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm text-foreground">Active</span>
          </label>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !formData.code}
              className="flex-1 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {promo ? 'Update Code' : 'Create Code'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}