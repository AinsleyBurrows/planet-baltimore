import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Mail, Check, MessageCircle, Send, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { base44 } from '@/api/base44Client';

const SOCIAL_PLATFORMS = [
  {
    name: 'Facebook',
    color: 'bg-[#1877F2] hover:bg-[#1877F2]/90',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.93-1.956 1.886v2.286h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
    ),
    getUrl: (url, title) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: 'X (Twitter)',
    color: 'bg-black hover:bg-black/80',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
    getUrl: (url, title) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    name: 'Instagram',
    color: 'bg-gradient-to-br from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] hover:opacity-90',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
    ),
    getUrl: (url) => `https://www.instagram.com/`,
    note: 'Copy link to share on Instagram',
  },
  {
    name: 'WhatsApp',
    color: 'bg-[#25D366] hover:bg-[#25D366]/90',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    ),
    getUrl: (url, title) => `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
  },
  {
    name: 'LinkedIn',
    color: 'bg-[#0A66C2] hover:bg-[#0A66C2]/90',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    ),
    getUrl: (url, title) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: 'Telegram',
    color: 'bg-[#2CA5E0] hover:bg-[#2CA5E0]/90',
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    ),
    getUrl: (url, title) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

export default function ShareModal({ isOpen, onClose, url, title, description }) {
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [followerUsers, setFollowerUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const shareUrl = url || window.location.href;
  const shareTitle = title || document.title;

  useEffect(() => {
    if (!isOpen) { setSelected([]); setSent(false); setSearch(''); return; }
    base44.auth.me().then(async (me) => {
      if (!me) return;
      setCurrentUser(me);
      // fetch people this user follows (so they can send to people they know)
      const follows = await base44.entities.Follow.filter({ follower_id: me.id, target_type: 'user' }, '-created_date', 100);
      setFollowers(follows);
      // Also fetch people who follow this user
      const inbound = await base44.entities.Follow.filter({ target_type: 'user', target_id: me.id }, '-created_date', 100);
      // Merge unique user IDs
      const allIds = [...new Set([...follows.map(f => f.target_id), ...inbound.map(f => f.follower_id)])];
      // Build lightweight user objects from follow records
      const userMap = {};
      follows.forEach(f => { userMap[f.target_id] = { id: f.target_id, full_name: f.target_name || f.target_id, avatar_url: null }; });
      inbound.forEach(f => { if (!userMap[f.follower_id]) userMap[f.follower_id] = { id: f.follower_id, full_name: f.follower_id, avatar_url: null }; });
      setFollowerUsers(Object.values(userMap));
    }).catch(() => {});
  }, [isOpen]);

  const filtered = followerUsers.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSendToFollowers = async () => {
    if (!currentUser || selected.length === 0) return;
    setSending(true);
    const messageContent = `${currentUser.full_name} shared something with you: ${shareTitle}\n${shareUrl}`;
    await Promise.all(selected.map(recipientId => {
      const recipient = followerUsers.find(u => u.id === recipientId);
      const convId = [currentUser.id, recipientId].sort().join('_');
      return base44.entities.Message.create({
        conversation_id: convId,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name,
        sender_avatar: currentUser.avatar_url,
        recipient_id: recipientId,
        recipient_name: recipient?.full_name || recipientId,
        content: messageContent,
      });
    }));
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setSelected([]);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(shareTitle);
    const body = encodeURIComponent(`${description ? description + '\n\n' : ''}${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSocialShare = (platform) => {
    const shareWindow = window.open(platform.getUrl(shareUrl, shareTitle), '_blank', 'width=600,height=500');
    if (shareWindow) shareWindow.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full sm:max-w-sm bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Share</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Title preview */}
              {title && (
                <p className="text-sm text-muted-foreground line-clamp-2 bg-secondary/50 rounded-lg px-3 py-2">{title}</p>
              )}

              {/* Send to followers */}
              {currentUser && followerUsers.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Send to people you know</p>
                    {selected.length > 0 && (
                      <Button size="sm" onClick={handleSendToFollowers} disabled={sending}
                        className={`h-7 px-3 text-xs rounded-lg gap-1 ${sent ? 'bg-green-500 hover:bg-green-500 text-white' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}>
                        {sent ? <><Check className="w-3 h-3" />Sent!</> : sending ? 'Sending…' : <><Send className="w-3 h-3" />Send ({selected.length})</>}
                      </Button>
                    )}
                  </div>
                  {followerUsers.length > 4 && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-input bg-secondary text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Search…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {filtered.slice(0, 20).map(u => {
                      const isSelected = selected.includes(u.id);
                      return (
                        <button key={u.id} onClick={() => toggle(u.id)}
                          className={`flex flex-col items-center gap-1 flex-shrink-0 p-1.5 rounded-xl transition-all ${isSelected ? 'bg-accent/15 ring-2 ring-accent' : 'hover:bg-secondary'}`}>
                          <div className="relative">
                            <Avatar className="w-11 h-11">
                              <AvatarImage src={u.avatar_url} />
                              <AvatarFallback className="bg-secondary text-foreground font-semibold text-sm">{u.full_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
                            </Avatar>
                            {isSelected && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-accent-foreground" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-foreground w-12 text-center truncate leading-tight">{u.full_name?.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-b border-border" />
                </div>
              )}

              {/* Social platforms grid */}
              <div className="grid grid-cols-3 gap-3">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <button
                    key={platform.name}
                    onClick={() => handleSocialShare(platform)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-150 active:scale-90 shadow-sm ${platform.color}`}>
                      {platform.icon}
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">{platform.name}</span>
                  </button>
                ))}

                {/* Email */}
                <button onClick={handleEmail} className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 hover:bg-orange-500/90 flex items-center justify-center transition-all duration-150 active:scale-90 shadow-sm">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Email</span>
                </button>

                {/* Message (SMS) */}
                <button
                  onClick={() => window.open(`sms:?body=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-green-500 hover:bg-green-500/90 flex items-center justify-center transition-all duration-150 active:scale-90 shadow-sm">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Message</span>
                </button>
              </div>

              {/* Copy link */}
              <div className="flex items-center gap-2 p-3 bg-secondary/60 rounded-xl border border-border">
                <span className="text-xs text-muted-foreground flex-1 truncate">{shareUrl}</span>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className={`flex-shrink-0 h-8 px-3 rounded-lg transition-all ${copied ? 'bg-green-500 hover:bg-green-500 text-white' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="ml-1 text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}