import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RESIDENCY_OPTIONS = [
  'Less than 1 year',
  '1–2 years',
  '3–5 years',
  '6–10 years',
  '11–20 years',
  'More than 20 years',
  'Lifelong resident',
];

export default function JoinAssociationModal({ associationName, onConfirm, onClose }) {
  const [address, setAddress] = useState('');
  const [years, setYears] = useState('');
  const [saving, setSaving] = useState(false);

  const handleJoin = async () => {
    setSaving(true);
    await onConfirm({ address: address.trim(), years_in_neighborhood: years });
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full sm:max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Join {associationName}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">Welcome! Please provide a few details to complete your membership.</p>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Home Address
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="e.g. 123 Main St, Baltimore, MD 21201"
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Only visible to association admins — never shown publicly
              </p>
            </div>

            {/* Years in neighborhood */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                How long have you lived in the neighborhood?
              </label>
              <select
                value={years}
                onChange={e => setYears(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
              >
                <option value="">Select length of residency…</option>
                {RESIDENCY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Only visible to association admins — never shown publicly
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={handleJoin}
                disabled={saving}
              >
                {saving ? 'Joining…' : 'Complete Sign Up'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}