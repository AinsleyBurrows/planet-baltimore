import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle, Users, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';

export default function ArtsOrgMessageModal({ org, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [recipientMode, setRecipientMode] = useState('all'); // 'all' | 'select'
  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [showFollowers, setShowFollowers] = useState(false);

  useEffect(() => {
    const fetchFollowers = async () => {
      setLoadingFollowers(true);
      try {
        const follows = await base44.entities.Follow.filter({ target_id: org.id });
        // Fetch user details for each follower
        const userDetails = await Promise.all(
          follows.map(f => base44.entities.User.filter({ id: f.follower_id }).then(r => r[0]).catch(() => null))
        );
        setFollowers(userDetails.filter(Boolean));
      } catch {}
      setLoadingFollowers(false);
    };
    fetchFollowers();
  }, [org.id]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredFollowers = followers.filter(f =>
    f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.email?.toLowerCase().includes(search.toLowerCase())
  );

  const recipientIds = recipientMode === 'all'
    ? followers.map(f => f.id)
    : [...selectedIds];

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || recipientIds.length === 0) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendBulkMessage', {
        recipientIds,
        subject: subject.trim(),
        body: body.trim(),
        senderName: org.name,
      });
      setResult({ sent: res.data?.successCount ?? 0, failed: res.data?.failureCount ?? 0 });
    } catch {
      setResult({ sent: 0, failed: 1 });
    }
    setSending(false);
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
          className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-semibold text-foreground">Message Followers</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {result ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-green-600" />
                </div>
                <p className="font-semibold text-foreground">Message sent!</p>
                <p className="text-sm text-muted-foreground">
                  Delivered to {result.sent} follower{result.sent !== 1 ? 's' : ''}.
                  {result.failed > 0 && ` (${result.failed} failed)`}
                </p>
                <Button onClick={onClose} className="bg-accent hover:bg-accent/90 text-accent-foreground w-full">Done</Button>
              </div>
            ) : (
              <>
                {/* Recipient selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Recipients</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRecipientMode('all')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${recipientMode === 'all' ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'}`}
                    >
                      All Followers {!loadingFollowers && followers.length > 0 && `(${followers.length})`}
                    </button>
                    <button
                      onClick={() => { setRecipientMode('select'); setShowFollowers(true); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${recipientMode === 'select' ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'}`}
                    >
                      Select Group {recipientMode === 'select' && selectedIds.size > 0 && `(${selectedIds.size})`}
                    </button>
                  </div>

                  {/* Follower picker */}
                  {recipientMode === 'select' && (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <button
                        onClick={() => setShowFollowers(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/40 text-sm font-medium hover:bg-secondary/70 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-accent" />
                          {selectedIds.size === 0 ? 'Choose followers…' : `${selectedIds.size} selected`}
                        </span>
                        {showFollowers ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>

                      {showFollowers && (
                        <div className="max-h-48 overflow-y-auto">
                          <div className="px-3 py-2 border-b border-border">
                            <div className="flex items-center gap-2 bg-secondary rounded-lg px-2 py-1.5">
                              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                              <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search followers…"
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                              />
                            </div>
                          </div>
                          {loadingFollowers ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : filteredFollowers.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No followers found.</p>
                          ) : (
                            filteredFollowers.map(f => (
                              <label key={f.id} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(f.id)}
                                  onChange={() => toggleSelect(f.id)}
                                  className="rounded"
                                />
                                <Avatar className="w-7 h-7 flex-shrink-0">
                                  <AvatarImage src={f.avatar_url} />
                                  <AvatarFallback className="text-xs bg-accent/10 text-accent">{f.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{f.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Subject</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                    placeholder="Announcement subject…"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>

                {/* Body */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <textarea
                    className="w-full h-36 rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                    placeholder="Write your message to followers…"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground text-right">{body.length} characters</p>
                </div>
              </>
            )}
          </div>

          {!result && (
            <div className="px-5 py-4 border-t border-border flex-shrink-0">
              <Button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !body.trim() || recipientIds.length === 0}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />
                    Send to {recipientMode === 'all' ? `All ${followers.length} Followers` : `${selectedIds.size} Follower${selectedIds.size !== 1 ? 's' : ''}`}
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}