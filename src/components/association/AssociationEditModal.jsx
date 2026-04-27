import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient, useQuery } from '@tanstack/react-query';

export default function AssociationEditModal({ association, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: association.name || '',
    tagline: association.tagline || '',
    description: association.description || '',
    neighborhood_id: association.neighborhood_id || '',
    neighborhood_name: association.neighborhood_name || '',
    address: association.address || '',
    website: association.website || '',
    contact_email: association.contact_email || '',
    phone: association.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods-list'],
    queryFn: () => base44.entities.Neighborhood.list('name', 100),
  });

  const handleNeighborhoodChange = (e) => {
    const id = e.target.value;
    const found = neighborhoods.find(n => n.id === id);
    setForm(f => ({ ...f, neighborhood_id: id, neighborhood_name: found?.name || '' }));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.CommunityAssociation.update(association.id, form);
    queryClient.invalidateQueries({ queryKey: ['community-association', association.id] });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Edit Association</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tagline</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Short motto or mission statement" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Tell residents about this association…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Neighborhood</label>
              <select
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.neighborhood_id}
                onChange={handleNeighborhoodChange}
              >
                <option value="">Select neighborhood…</option>
                {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Address</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Meeting address" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Email</label>
              <input type="email" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <input type="tel" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Website</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
        </Button>
      </motion.div>
    </div>
  );
}