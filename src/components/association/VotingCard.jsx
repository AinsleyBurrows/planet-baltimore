import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Check, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

export default function VotingCard({ voting, currentUser, isAdmin, associationId }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  const { data: votes = [] } = useQuery({
    queryKey: ['votes', voting.id],
    queryFn: () => base44.entities.Vote.filter({ voting_id: voting.id }, '-created_date', 200),
    enabled: !!voting.id,
  });

  useEffect(() => {
    if (currentUser && votes.length > 0) {
      const userVoted = votes.some(v => v.user_id === currentUser.id);
      setHasVoted(userVoted);
    }
  }, [currentUser, votes]);

  const castVoteMutation = useMutation({
    mutationFn: async (option) => {
      await base44.entities.Vote.create({
        voting_id: voting.id,
        user_id: currentUser.id,
        selected_option: option,
      });
      await base44.entities.Voting.update(voting.id, {
        vote_count: (voting.vote_count || 0) + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes', voting.id] });
      queryClient.invalidateQueries({ queryKey: ['association-votings', associationId] });
      setHasVoted(true);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) =>
      base44.entities.Voting.update(voting.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['association-votings', associationId] });
    },
  });

  const deleteVotingMutation = useMutation({
    mutationFn: () => base44.entities.Voting.delete(voting.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['association-votings', associationId] });
    },
  });

  const isVotingOpen = voting.status === 'open' && (!voting.end_date || new Date(voting.end_date) > new Date());
  const optionVotes = voting.options?.map(option => ({
    option,
    count: votes.filter(v => v.selected_option === option).length,
    percentage: votes.length > 0 ? Math.round((votes.filter(v => v.selected_option === option).length / votes.length) * 100) : 0,
  })) || [];

  const statusColor = {
    open: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between p-4 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{voting.title}</h3>
            <Badge className={statusColor[voting.status] || 'bg-gray-100'} variant="outline">
              {voting.status}
            </Badge>
          </div>
          {voting.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">{voting.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>{votes.length} vote{votes.length !== 1 ? 's' : ''}</span>
            {voting.end_date && (
              <>
                <span>·</span>
                <span>
                  {isVotingOpen ? 'Closes' : 'Closed'} {format(new Date(voting.end_date), 'MMM d, yyyy')}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {hasVoted && isVotingOpen && <Check className="w-4 h-4 text-green-600" />}
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-secondary/20">
          <div className="space-y-2.5">
            {voting.options?.map((option, idx) => {
              const voteData = optionVotes[idx];
              return (
                <div key={option} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{option}</span>
                    <span className="text-xs text-muted-foreground">
                      {voteData?.count || 0} ({voteData?.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${voteData?.percentage || 0}%` }}
                    />
                  </div>
                  {isVotingOpen && currentUser && !hasVoted && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => castVoteMutation.mutate(option)}
                      disabled={castVoteMutation.isPending}
                      className="w-full text-xs h-8 rounded-lg"
                    >
                      {castVoteMutation.isPending ? 'Voting...' : 'Vote for this'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {isAdmin && (
            <div className="border-t border-border pt-3 flex gap-2">
              {voting.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate('open')}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 text-xs h-8 rounded-lg"
                >
                  Open Voting
                </Button>
              )}
              {voting.status === 'open' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate('closed')}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 text-xs h-8 rounded-lg"
                >
                  Close Voting
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Delete this voting?')) {
                    deleteVotingMutation.mutate();
                  }
                }}
                disabled={deleteVotingMutation.isPending}
                className="text-xs h-8 text-destructive hover:text-destructive rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {!isVotingOpen && currentUser && !hasVoted && (
            <p className="text-xs text-muted-foreground text-center italic">Voting has closed.</p>
          )}
        </div>
      )}
    </div>
  );
}