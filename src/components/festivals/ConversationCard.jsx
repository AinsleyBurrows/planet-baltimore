import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Users, Clock, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import AddParticipantModal from '@/components/festivals/AddParticipantModal';

const ACCENT = '#d4580a';

export default function ConversationCard({ conversation }) {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['conversation-participants', conversation.id],
    queryFn: () => base44.entities.ConversationParticipant.filter({ conversation_id: conversation.id }, 'sort_order', 50),
    staleTime: 30000,
  });

  const rsvped = user ? (conversation.rsvped_user_ids || []).includes(user.id) : false;

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      const ids = conversation.rsvped_user_ids || [];
      const next = rsvped ? ids.filter(id => id !== user.id) : [...ids, user.id];
      return base44.entities.Conversation.update(conversation.id, {
        rsvped_user_ids: next,
        rsvp_count: next.length,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {conversation.image_url ? (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img src={conversation.image_url} alt={conversation.title} className="w-full h-full object-cover" />
        </div>
      ) : null}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-foreground text-lg">{conversation.title}</h3>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
          {conversation.scheduled_time && (
            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {conversation.scheduled_time}</span>
          )}
          {conversation.location && (
            <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {conversation.location}</span>
          )}
        </div>
        {conversation.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{conversation.description}</p>
        )}

        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Participants
            </span>
            {user && (
              <button onClick={() => setShowAddParticipant(true)} className="text-xs font-medium hover:underline inline-flex items-center gap-1" style={{ color: ACCENT }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : participants.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No participants yet.</p>
          ) : (
            <div className="space-y-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-2.5">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    {p.role && <p className="text-xs text-muted-foreground truncate">{p.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <Button
            variant={rsvped ? 'default' : 'outline'}
            onClick={() => rsvpMutation.mutate()}
            disabled={rsvpMutation.isPending}
            className="mt-4 w-full gap-2"
            style={rsvped ? { backgroundColor: ACCENT } : { borderColor: ACCENT, color: ACCENT }}
          >
            <Users className="w-4 h-4" />
            {rsvped ? `Going (${conversation.rsvp_count || 0})` : `RSVP (${conversation.rsvp_count || 0})`}
          </Button>
        )}
      </div>

      {showAddParticipant && (
        <AddParticipantModal open={showAddParticipant} onOpenChange={setShowAddParticipant} conversationId={conversation.id} />
      )}
    </div>
  );
}