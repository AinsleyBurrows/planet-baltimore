import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Clock, Lock } from 'lucide-react';
import { format } from 'date-fns';
import VotingCard from './VotingCard';
import VotingModal from './VotingModal';

export default function VotingTab({ associationId, isAdmin }) {
  const queryClient = useQueryClient();
  const [showCreateVoting, setShowCreateVoting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: votings = [] } = useQuery({
    queryKey: ['association-votings', associationId],
    queryFn: () => base44.entities.Voting.filter({ association_id: associationId }, '-created_date', 50),
    enabled: !!associationId,
  });

  const handleCreateSuccess = () => {
    setShowCreateVoting(false);
    queryClient.invalidateQueries({ queryKey: ['association-votings', associationId] });
  };

  const openVotings = votings.filter(v => v.status === 'open');
  const closedVotings = votings.filter(v => v.status === 'closed');
  const draftVotings = votings.filter(v => v.status === 'draft');

  return (
    <div className="space-y-6">
      {isAdmin && (
        <button
          onClick={() => setShowCreateVoting(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all w-full justify-center"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium text-muted-foreground">Create New Voting</span>
        </button>
      )}

      {/* Active Votings */}
      {openVotings.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-accent" />
            Active Votes ({openVotings.length})
          </h3>
          <div className="space-y-3">
            {openVotings.map(voting => (
              <VotingCard
                key={voting.id}
                voting={voting}
                currentUser={currentUser}
                isAdmin={isAdmin}
                associationId={associationId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Closed Votings */}
      {closedVotings.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Completed Votes ({closedVotings.length})
          </h3>
          <div className="space-y-3">
            {closedVotings.map(voting => (
              <VotingCard
                key={voting.id}
                voting={voting}
                currentUser={currentUser}
                isAdmin={isAdmin}
                associationId={associationId}
              />
            ))}
          </div>
        </div>
      )}

      {/* Draft Votings (Admin Only) */}
      {isAdmin && draftVotings.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <Badge variant="secondary">Draft</Badge>
            ({draftVotings.length})
          </h3>
          <div className="space-y-3">
            {draftVotings.map(voting => (
              <VotingCard
                key={voting.id}
                voting={voting}
                currentUser={currentUser}
                isAdmin={isAdmin}
                associationId={associationId}
              />
            ))}
          </div>
        </div>
      )}

      {votings.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No voting items yet.</p>
          {isAdmin && <p className="text-xs mt-1">Create one to start gathering community input.</p>}
        </div>
      )}

      {showCreateVoting && (
        <VotingModal
          associationId={associationId}
          onClose={() => setShowCreateVoting(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}