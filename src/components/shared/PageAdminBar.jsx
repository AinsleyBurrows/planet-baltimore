import React, { useState } from 'react';
import { Trash2, VolumeX, Volume2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable bar shown on page detail views.
 * - isOwner: shows Delete button
 * - isPlatformAdmin: shows Mute/Unmute button
 */
export default function PageAdminBar({ isOwner, isPlatformAdmin, isMuted, muteReason, onDelete, onMute, onUnmute }) {
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this page? This cannot be undone.')) return;
    setLoading(true);
    await onDelete();
    setLoading(false);
  };

  const handleMute = async () => {
    setLoading(true);
    await onMute(reason);
    setLoading(false);
    setShowMuteDialog(false);
    setReason('');
  };

  const handleUnmute = async () => {
    if (!window.confirm('Remove the mute on this page?')) return;
    setLoading(true);
    await onUnmute();
    setLoading(false);
  };

  if (!isOwner && !isPlatformAdmin) return null;

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap mt-2">
        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={handleDelete}
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive text-xs h-8"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Page
          </Button>
        )}
        {isPlatformAdmin && (
          isMuted ? (
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={handleUnmute}
              className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50 text-xs h-8"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Unmute Page
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => setShowMuteDialog(true)}
              className="gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 text-xs h-8"
            >
              <VolumeX className="w-3.5 h-3.5" />
              Mute Page
            </Button>
          )
        )}
      </div>

      {/* Muted banner visible to everyone */}
      {isMuted && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
          <VolumeX className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">This page has been muted by a platform admin.</p>
            {muteReason && <p className="text-xs mt-0.5 text-orange-700">{muteReason}</p>}
          </div>
        </div>
      )}

      {/* Mute dialog */}
      <AnimatePresence>
        {showMuteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowMuteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-foreground">Mute this page</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Muted pages remain accessible via direct link but are hidden from all public listings and searches. The page owner will see a notice.
              </p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Reason (shown to page owner)</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Content violates community guidelines…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleMute}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? 'Muting…' : 'Confirm Mute'}
                </Button>
                <Button variant="outline" onClick={() => setShowMuteDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}