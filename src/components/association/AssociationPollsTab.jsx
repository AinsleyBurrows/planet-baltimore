import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, BarChart2, CheckCircle2, Trash2, Users, Lock } from 'lucide-react';
import { format } from 'date-fns';

function CreatePollModal({ associationId, currentUser, onClose, onCreated }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [saving, setSaving] = useState(false);

  const addOption = () => setOptions(prev => [...prev, '']);
  const removeOption = (i) => setOptions(prev => prev.filter((_, idx) => idx !== i));
  const updateOption = (i, val) => setOptions(prev => prev.map((o, idx) => idx === i ? val : o));

  const handleSave = async () => {
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || cleanOptions.length < 2) return;
    setSaving(true);
    await base44.entities.Voting.create({
      association_id: associationId,
      title: question.trim(),
      voting_type: 'multiple_choice',
      options: cleanOptions,
      status: 'open',
      created_by: currentUser.id,
      vote_count: 0,
    });
    setSaving(false);
    onCreated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><BarChart2 className="w-4 h-4 text-accent" />Create Poll</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Poll question</label>
            <textarea
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
              rows={2}
              placeholder="Ask the community something..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Answer options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => updateOption(i, e.target.value)}
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button onClick={addOption} className="mt-2 flex items-center gap-1.5 text-sm text-accent hover:underline">
                <Plus className="w-3.5 h-3.5" />Add option
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={saving || !question.trim() || options.filter(o => o.trim()).length < 2}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {saving ? 'Creating...' : 'Launch Poll'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PollCard({ poll, currentUser, isAdmin }) {
  const queryClient = useQueryClient();

  const { data: votes = [] } = useQuery({
    queryKey: ['poll-votes', poll.id],
    queryFn: () => base44.entities.Vote.filter({ voting_id: poll.id }),
    refetchInterval: 5000, // real-time feel: refresh every 5s
  });

  const myVote = votes.find(v => v.user_id === currentUser?.id);
  const totalVotes = votes.length;

  const voteMutation = useMutation({
    mutationFn: async (option) => {
      await base44.entities.Vote.create({
        voting_id: poll.id,
        user_id: currentUser.id,
        selected_option: option,
      });
      await base44.entities.Voting.update(poll.id, { vote_count: totalVotes + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll-votes', poll.id] });
      queryClient.invalidateQueries({ queryKey: ['assoc-polls'] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: () => base44.entities.Voting.update(poll.id, { status: 'closed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assoc-polls'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Voting.delete(poll.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assoc-polls'] }),
  });

  const getCount = (option) => votes.filter(v => v.selected_option === option).length;
  const getPct = (option) => totalVotes === 0 ? 0 : Math.round((getCount(option) / totalVotes) * 100);
  const isClosed = poll.status === 'closed';
  const showResults = !!myVote || isClosed;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-accent flex-shrink-0" />
            <p className="font-semibold text-foreground text-sm">{poll.title}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
            <span>·</span>
            {isClosed ? (
              <Badge variant="secondary" className="text-xs flex items-center gap-1 px-1.5 py-0"><Lock className="w-2.5 h-2.5" />Closed</Badge>
            ) : (
              <Badge className="text-xs bg-green-500/10 text-green-600 border-0 px-1.5 py-0">Open</Badge>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1 flex-shrink-0">
            {!isClosed && (
              <button
                onClick={() => closeMutation.mutate()}
                className="text-xs px-2 py-1 rounded-lg bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            )}
            <button
              onClick={() => { if (window.confirm('Delete this poll?')) deleteMutation.mutate(); }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {(poll.options || []).map((option, i) => {
          const pct = getPct(option);
          const count = getCount(option);
          const isMyChoice = myVote?.selected_option === option;

          if (showResults) {
            // Show results with progress bar
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isMyChoice && <CheckCircle2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
                    <span className={`truncate ${isMyChoice ? 'font-semibold text-accent' : 'text-foreground'}`}>{option}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{pct}% · {count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isMyChoice ? 'bg-accent' : 'bg-primary/40'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          }

          // Voting buttons (haven't voted yet)
          return (
            <button
              key={i}
              onClick={() => currentUser && !voteMutation.isPending && voteMutation.mutate(option)}
              disabled={voteMutation.isPending || !currentUser}
              className="w-full text-left px-3 py-2.5 rounded-lg border border-border hover:border-accent hover:bg-accent/5 text-sm font-medium text-foreground transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            >
              {option}
            </button>
          );
        })}
      </div>

      {!currentUser && !isClosed && (
        <p className="text-xs text-muted-foreground text-center">Sign in to vote</p>
      )}
      {myVote && !isClosed && (
        <p className="text-xs text-muted-foreground text-center">You voted · results update live</p>
      )}
    </div>
  );
}

export default function AssociationPollsTab({ associationId, isAdmin }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: polls = [] } = useQuery({
    queryKey: ['assoc-polls', associationId],
    queryFn: () => base44.entities.Voting.filter({ association_id: associationId }, '-created_date', 50),
    enabled: !!associationId,
  });

  return (
    <div className="space-y-4">
      {isAdmin && (
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all w-full justify-center"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Create Poll</span>
        </button>
      )}

      {polls.length === 0 ? (
        <div className="text-center py-12">
          <BarChart2 className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-30" />
          <p className="text-sm text-muted-foreground">No polls yet.</p>
          {isAdmin && <p className="text-xs text-muted-foreground mt-1">Create a poll to gather community feedback.</p>}
        </div>
      ) : (
        polls.map(poll => (
          <PollCard
            key={poll.id}
            poll={poll}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
        ))
      )}

      {showCreate && currentUser && (
        <CreatePollModal
          associationId={associationId}
          currentUser={currentUser}
          onClose={() => setShowCreate(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['assoc-polls', associationId] })}
        />
      )}
    </div>
  );
}