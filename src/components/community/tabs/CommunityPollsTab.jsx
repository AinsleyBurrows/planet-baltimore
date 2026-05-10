import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BarChart2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function CommunityPollsTab({ community, isOwner, currentUserId }) {
  const queryClient = useQueryClient();
  const polls = community.hub_data?.polls || [];
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);

  const saveAll = async (list) => {
    await base44.entities.Community.update(community.id, {
      hub_data: { ...(community.hub_data || {}), polls: list }
    });
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
  };

  const handleCreate = async () => {
    const filtered = options.filter(o => o.trim());
    if (!question.trim() || filtered.length < 2) return;
    setSaving(true);
    const newPoll = {
      id: Date.now().toString(),
      question,
      options: filtered.map(o => ({ text: o, votes: [] })),
      created_at: new Date().toISOString(),
    };
    await saveAll([newPoll, ...polls]);
    setQuestion(''); setOptions(['', '']); setShowForm(false); setSaving(false);
  };

  const handleVote = async (pollIdx, optionIdx) => {
    if (!currentUserId) return;
    const updated = polls.map((p, pi) => {
      if (pi !== pollIdx) return p;
      const hasVoted = p.options.some(o => o.votes?.includes(currentUserId));
      if (hasVoted) return p;
      return {
        ...p,
        options: p.options.map((o, oi) =>
          oi === optionIdx ? { ...o, votes: [...(o.votes || []), currentUserId] } : o
        )
      };
    });
    await saveAll(updated);
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Delete this poll?')) return;
    await saveAll(polls.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Create Poll
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Poll question *" value={question} onChange={e => setQuestion(e.target.value)} />
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder={`Option ${i + 1}`} value={opt} onChange={e => setOptions(opts => opts.map((o, j) => j === i ? e.target.value : o))} />
                {options.length > 2 && (
                  <button onClick={() => setOptions(opts => opts.filter((_, j) => j !== i))} className="p-2 text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button onClick={() => setOptions(o => [...o, ''])} className="text-xs text-accent hover:underline">+ Add option</button>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={saving || !question.trim() || options.filter(o => o.trim()).length < 2} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Create'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {polls.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No polls yet.</p>
      ) : (
        <div className="space-y-4">
          {polls.map((poll, pi) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0);
            const userVoted = poll.options.some(o => o.votes?.includes(currentUserId));
            return (
              <div key={pi} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground text-sm">{poll.question}</p>
                  {isOwner && (
                    <button onClick={() => handleDelete(pi)} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {poll.options.map((opt, oi) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes?.length || 0) / totalVotes * 100) : 0;
                    return (
                      <button
                        key={oi}
                        onClick={() => !userVoted && handleVote(pi, oi)}
                        disabled={userVoted}
                        className="w-full text-left"
                      >
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground font-medium">{opt.text}</span>
                          <span className="text-muted-foreground">{opt.votes?.length || 0} vote{(opt.votes?.length || 0) !== 1 ? 's' : ''} · {pct}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />{totalVotes} total vote{totalVotes !== 1 ? 's' : ''}</span>
                  {poll.created_at && <span>{format(new Date(poll.created_at), 'MMM d, yyyy')}</span>}
                </div>
                {userVoted && <p className="text-xs text-accent">You've voted</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}