import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertCircle, CheckCircle, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function CheckInScanner({ eventId, onClose }) {
  const queryClient = useQueryClient();
  const videoRef = useRef(null);
  const [lastScanned, setLastScanned] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [manualCode, setManualCode] = useState('');

  const checkInMutation = useMutation({
    mutationFn: async (ticketId) => {
      const user = await base44.auth.me();
      const ticket = await base44.entities.Ticket.filter({ id: ticketId });
      
      if (!ticket[0]) throw new Error('Ticket not found');
      if (ticket[0].is_checked_in) throw new Error('Already checked in');

      await base44.entities.Ticket.update(ticketId, {
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      });

      return ticket[0];
    },
    onSuccess: (ticket) => {
      setLastScanned(ticket);
      setMessage({ type: 'success', text: `✓ ${ticket.owner_email} checked in!` });
      setManualCode('');
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
    onError: (error) => {
      setMessage({ type: 'error', text: error.message });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    },
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode) return;
    try {
      const data = JSON.parse(manualCode);
      if (data.ticket_id) {
        checkInMutation.mutate(data.ticket_id);
      } else {
        setMessage({ type: 'error', text: 'Invalid ticket code' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Invalid format' });
      setTimeout(() => setMessage({ type: '', text: '' }), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-foreground">Check In Attendees</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Manual Entry Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-sm text-muted-foreground">Scan a QR code or enter the ticket code manually.</p>
          
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Paste QR code data or ticket code"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
            <Button
              type="submit"
              disabled={!manualCode || checkInMutation.isPending}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              {checkInMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
              ) : (
                <>Check In</>
              )}
            </Button>
          </form>

          {/* Status Message */}
          {message.text && (
            <div className={`px-3 py-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-destructive/10 border border-destructive/30'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-700' : 'text-destructive'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {/* Last Checked In */}
          {lastScanned && (
            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-2">
              <p className="text-xs text-muted-foreground">Last checked in:</p>
              <div>
                <p className="font-medium text-foreground">{lastScanned.owner_email}</p>
                <p className="text-xs text-muted-foreground">{lastScanned.ticket_number}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close Scanner
          </Button>
        </div>
      </motion.div>
    </div>
  );
}