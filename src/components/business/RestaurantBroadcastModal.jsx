import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, Users, AlertCircle, Search, UserCheck, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';

export default function RestaurantBroadcastModal({ business, currentUser, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [followers, setFollowers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    base44.entities.Follow.filter({ target_type: 'business', target_id: business.id }, '-created_date', 500)
      .then(async (follows) => {
        const userPromises = follows.map(f =>
          base44.entities.User.filter({ id: f.follower_id }).then(r => r[0]).catch(() => null)
        );
        const users = (await Promise.all(userPromises)).filter(Boolean);
        setFollowers(users);
        setSelectedIds(new Set(users.map(u => u.id)));
      })
      .catch(() => setFollowers([]))
      .finally(() => setLoadingFollowers(false));
  }, [business.id]);

  const filteredFollowers = followers.filter(f =>
    f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFollower = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === followers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(followers.map(f => f.id)));
    }
  };

  const handleSend = async () => {
    if (!body.trim() || selectedIds.size === 0) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendBulkMessage', {
        recipientIds: Array.from(selectedIds),
        subject: subject || `Message from ${business.name}`,
        body: body.trim(),
        senderName: business.name,
      });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setSending(false);
    }
  };

  const allSelected = followers.length > 0 && selectedIds.size === followers.length;

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
          className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">Message Followers</h2>
              <span className="text-xs text-muted-foreground">— {business.name}</span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {result ? (
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
                <Button onClick={onClose} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground mt-2">Done</Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject (optional)</label>
                    <input
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      placeholder={`Message from ${business.name}`}
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                    <textarea
                      className="w-full h-28 px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      placeholder="Write your message to followers…"
                      value={body}
                      onChange={e => setBody(e.target.value)}
                    />
                  </div>
                </div>

                {/* Recipient selector */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-secondary/40 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Recipients ({selectedIds.size} of {followers.length})
                    </span>
                    <button
                      onClick={toggleAll}
                      className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                    >
                      {allSelected ? <><UserMinus className="w-3.5 h-3.5" /> Deselect all</> : <><UserCheck className="w-3.5 h-3.5" /> Select all</>}
                    </button>
                  </div>

                  {loadingFollowers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : followers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No followers yet.</p>
                  ) : (
                    <>
                      {followers.length > 5 && (
                        <div className="px-3 py-2 border-b border-border">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                              placeholder="Search followers…"
                              value={search}
                              onChange={e => setSearch(e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                      <div className="max-h-48 overflow-y-auto divide-y divide-border">
                        {filteredFollowers.map(follower => {
                          const isSelected = selectedIds.has(follower.id);
                          return (
                            <button
                              key={follower.id}
                              onClick={() => toggleFollower(follower.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/50 ${isSelected ? 'bg-accent/5' : ''}`}
                            >
                              <Avatar className="w-8 h-8 flex-shrink-0">
                                <AvatarImage src={follower.avatar_url} />
                                <AvatarFallback className="text-xs bg-accent/10 text-accent">
                                  {follower.full_name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="flex-1 text-sm font-medium text-foreground truncate">{follower.full_name}</span>
                              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${isSelected ? 'bg-accent border-accent' : 'border-muted-foreground'}`}>
                                {isSelected && (
                                  <svg viewBox="0 0 16 16" className="w-full h-full text-accent-foreground" fill="currentColor">
                                    <path d="M12.5 4.5l-6 6-3-3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {filteredFollowers.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No followers match your search.</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {!result && (
            <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
              <Button
                onClick={handleSend}
                disabled={sending || !body.trim() || selectedIds.size === 0 || loadingFollowers}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4" /> Send to {selectedIds.size} Follower{selectedIds.size !== 1 ? 's' : ''}</>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}