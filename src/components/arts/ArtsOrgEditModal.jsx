import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function ArtsOrgEditModal({ org, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: org.name || '',
    tagline: org.tagline || '',
    description: org.description || '',
    mission: org.mission || '',
    address: org.address || '',
    contact_email: org.contact_email || '',
    phone: org.phone || '',
    website: org.website || '',
    hours: org.hours || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, form);
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="text-sm font-semibold text-foreground">Edit Organization Info</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {[
              { label: 'Name', key: 'name' },
              { label: 'Tagline', key: 'tagline' },
              { label: 'Website', key: 'website' },
              { label: 'Phone', key: 'phone' },
              { label: 'Contact Email', key: 'contact_email' },
              { label: 'Address', key: 'address' },
              { label: 'Hours', key: 'hours' },
            ].map(({ label, key }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mission</label>
              <textarea
                value={form.mission}
                onChange={e => set('mission', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-border flex-shrink-0">
            <Button onClick={handleSave} disabled={saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}