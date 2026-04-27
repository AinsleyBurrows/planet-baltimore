import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Send, CheckCircle2, Users, UserCheck, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CommunityMessageModal({ community, onClose }) {
  const [step, setStep] = useState('mode'); // 'mode' | 'pick' | 'compose' | 'sent'
  const [sendToAll, setSendToAll] = useState(true);
  const [followers, setFollowers] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    const follows = await base44.entities.Follow.filter({ target_type: 'community', target_id: community.id });
    // Enrich with user data where possible
    const users = await base44.entities.User.list('full_name', 200);
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const enriched = follows.map(f => ({
      id: f.follower_id,
      name: userMap[f.follower_id]?.full_name || f.target_name || 'Member',
      email: userMap[f.follower_id]?.email || '',
      avatar: userMap[f.follower_id]?.avatar_url || '',
    }));
    setFollowers(enriched);
    setLoadingFollowers(false);
  };

  const handleModeSelect = async (all) => {
    setSendToAll(all);
    if (!all) {
      await fetchFollowers();
      setStep('pick');
    } else {
      setStep('compose');
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredFollowers = followers.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  const recipients = sendToAll
    ? followers
    : followers.filter(f => selectedIds.has(f.id));

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    const targets = sendToAll ? followers : followers.filter(f => selectedIds.has(f.id));
    await Promise.all(
      targets.map(f =>
        f.email
          ? base44.integrations.Core.SendEmail({
              to: f.email,
              subject: subject || `Message from ${community.name}`,
              body: `${message}\n\n—\nThis message was sent via ${community.name} on Planet Baltimore.`,
            }).catch(() => {})
          : Promise.resolve()
      )
    );
    setSending(false);
    setStep('sent');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {(step === 'pick' || step === 'compose') && (
              <button onClick={() => setStep(step === 'compose' && !sendToAll ? 'pick' : 'mode')} className="p-1 rounded-full hover:bg-secondary mr-1">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {step === 'mode' && 'Message Members'}
                {step === 'pick' && 'Select Recipients'}
                {step === 'compose' && 'Write Message'}
                {step === 'sent' && 'Message Sent'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{community.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Step: mode */}
          {step === 'mode' && (
            <div className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground mb-4">Who do you want to message?</p>
              <button
                onClick={() => handleModeSelect(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">All Followers</p>
                    <p className="text-xs text-muted-foreground">Send to everyone following this community</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </button>
              <button
                onClick={() => handleModeSelect(false)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">Select Followers</p>
                    <p className="text-xs text-muted-foreground">Choose specific people to message</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
              </button>
            </div>
          )}

          {/* Step: pick recipients */}
          {step === 'pick' && (
            <div className="flex flex-col h-full">
              <div className="px-5 pt-4 pb-2 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="Search followers…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                {selectedIds.size > 0 && (
                  <p className="text-xs text-accent font-medium mt-2">{selectedIds.size} selected</p>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-1">
                {loadingFollowers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFollowers.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-10">No followers found.</p>
                ) : filteredFollowers.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleSelect(f.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedIds.has(f.id) ? 'bg-accent/10 border border-accent/30' : 'hover:bg-secondary border border-transparent'}`}
                  >
                    <Avatar className="w-9 h-9 flex-shrink-0">
                      <AvatarImage src={f.avatar} />
                      <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">{f.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                      {f.email && <p className="text-xs text-muted-foreground truncate">{f.email}</p>}
                    </div>
                    {selectedIds.has(f.id) && <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0"><span className="text-white text-xs">✓</span></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: compose */}
          {step === 'compose' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                {sendToAll ? 'Sending to all followers' : `Sending to ${selectedIds.size} selected follower${selectedIds.size !== 1 ? 's' : ''}`}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder={`Message from ${community.name}`}
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Message *</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[140px]"
                  placeholder="Write your message…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step: sent */}
          {step === 'sent' && (
            <div className="flex flex-col items-center justify-center py-12 px-5 gap-3">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="font-semibold text-foreground text-lg">Message Sent!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your message was sent to {sendToAll ? 'all community followers' : `${selectedIds.size} member${selectedIds.size !== 1 ? 's' : ''}`}.
              </p>
              <Button onClick={onClose} className="mt-4 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl px-8">Done</Button>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        {step === 'pick' && (
          <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
            <Button
              onClick={() => setStep('compose')}
              disabled={selectedIds.size === 0}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2"
            >
              Continue with {selectedIds.size} selected <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {step === 'compose' && (
          <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2"
            >
              {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <><Send className="w-4 h-4" />Send Message</>}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}