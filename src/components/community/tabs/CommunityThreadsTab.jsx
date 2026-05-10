import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, MessageSquare, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

export default function CommunityThreadsTab({ community, isOwner, user }) {
  const queryClient = useQueryClient();
  const threads = community.hub_data?.threads || [];
  const [openThread, setOpenThread] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const saveAll = async (list) => {
    await base44.entities.Community.update(community.id, {
      hub_data: { ...(community.hub_data || {}), threads: list }
    });
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
  };

  const createThread = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    const t = { id: Date.now().toString(), title, author_id: user.id, author_name: user.full_name, created_at: new Date().toISOString(), replies: [] };
    await saveAll([t, ...threads]);
    setTitle(''); setShowForm(false); setSaving(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !user || !openThread) return;
    const reply = { author_id: user.id, author_name: user.full_name, content: replyText, created_at: new Date().toISOString() };
    const updated = threads.map(t => t.id === openThread.id ? { ...t, replies: [...(t.replies || []), reply] } : t);
    await saveAll(updated);
    setReplyText('');
    setOpenThread(updated.find(t => t.id === openThread.id));
  };

  const deleteThread = async (id) => {
    if (!window.confirm('Delete this thread?')) return;
    await saveAll(threads.filter(t => t.id !== id));
    if (openThread?.id === id) setOpenThread(null);
  };

  if (openThread) {
    const current = threads.find(t => t.id === openThread.id) || openThread;
    return (
      <div className="space-y-4">
        <button onClick={() => setOpenThread(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to threads
        </button>
        <h3 className="font-semibold text-foreground">{current.title}</h3>
        <div className="space-y-3">
          {(current.replies || []).map((r, i) => (
            <div key={i} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{r.author_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-secondary rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{r.author_name}</p>
                <p className="text-sm text-foreground mt-0.5">{r.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{r.created_at ? format(new Date(r.created_at), 'MMM d, h:mm a') : ''}</p>
              </div>
            </div>
          ))}
          {(current.replies || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No replies yet. Start the discussion!</p>}
        </div>
        {user && (
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm"
              placeholder="Write a reply…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendReply())}
            />
            <Button size="icon" onClick={sendReply} disabled={!replyText.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-10 w-10">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {user && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> New Thread
          </Button>
        </div>
      )}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Thread topic *" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={createThread} disabled={saving || !title.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Creating…' : 'Create'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}
      {threads.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No threads yet. Start a discussion!</p>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <div key={t.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl cursor-pointer hover:shadow-sm transition-all" onClick={() => setOpenThread(t)}>
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground">by {t.author_name} · {t.replies?.length || 0} repl{(t.replies?.length || 0) !== 1 ? 'ies' : 'y'}</p>
              </div>
              {isOwner && (
                <button onClick={e => { e.stopPropagation(); deleteThread(t.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}