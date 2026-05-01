import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function BroadcastModal({ currentUser, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [followerIds, setFollowerIds] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Load all followers of the current user
    base44.entities.Follow.filter({ target_type: 'user', target_id: currentUser.id }, '-created_date', 500)
      .then(follows => setFollowerIds(follows.map(f => f.follower_id)))
      .catch(() => setFollowerIds([]))
      .finally(() => setLoadingFollowers(false));
  }, [currentUser.id]);

  const handleSend = async () => {
    if (!body.trim() || followerIds.length === 0) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendBulkMessage', {
        recipientIds: followerIds,
        subject: subject || `Message from ${currentUser.full_name}`,
        body: body.trim(),
        senderName: currentUser.full_name,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setSending(false);
    }
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
          className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">Message All Followers</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {result ? (
              /* Result screen */
              <div className="text-center py-6 space-y-3">
                {result.error ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                    <p className="font-semibold text-foreground">Something went wrong</p>
                    <p className="text-sm text-muted-foreground">{result.error}</p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <p className="font-semibold text-foreground">Message sent!</p>
                    <p className="text-sm text-muted-foreground">
                      Delivered to {result.successCount} of {result.totalAttempts} followers.
                    </p>
                  </>
                )}
                <Button onClick={onClose} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-2">
                  Done
                </Button>
              </div>
            ) : (
              <>
                {/* Follower count pill */}
                <div className="flex items-center gap-2 px-3 py-2 bg-secondary/60 rounded-xl text-sm">
                  <Users className="w-4 h-4 text-accent flex-shrink-0" />
                  {loadingFollowers ? (
                    <span className="text-muted-foreground">Loading followers…</span>
                  ) : (
                    <span className="text-foreground">
                      Sending to <strong>{followerIds.length}</strong> follower{followerIds.length !== 1 ? 's' : ''} via email
                    </span>
                  )}
                </div>

                {followerIds.length === 0 && !loadingFollowers && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    You don't have any followers yet.
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject (optional)</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      placeholder={`Message from ${currentUser.full_name}`}
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                    <textarea
                      className="w-full h-36 px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      placeholder="Write your message to all followers…"
                      value={body}
                      onChange={e => setBody(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSend}
                  disabled={sending || !body.trim() || followerIds.length === 0 || loadingFollowers}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                >
                  {sending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send to {followerIds.length} Follower{followerIds.length !== 1 ? 's' : ''}</>
                  )}
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}