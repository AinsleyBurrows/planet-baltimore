import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Ticket, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACCENT = '#d4580a';

export default function StageActCard({ act, userId }) {
  const queryClient = useQueryClient();
  const rsvped = userId && (act.rsvped_user_ids || []).includes(userId);
  const count = act.rsvp_count || 0;

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      const ids = act.rsvped_user_ids || [];
      const newIds = rsvped ? ids.filter(id => id !== userId) : [...ids, userId];
      return base44.entities.OtherStageAct.update(act.id, { rsvped_user_ids: newIds, rsvp_count: newIds.length });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['other-stage-acts'] }),
  });

  return (
    <div className="bg-secondary/30 border border-border rounded-xl overflow-hidden flex flex-col">
      {act.image_url ? (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img src={act.image_url} alt={act.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square w-full bg-secondary flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
      )}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-foreground text-sm">{act.name}</h4>
          {act.performance_time && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground whitespace-nowrap">{act.performance_time}</span>
          )}
        </div>
        {act.act_type && <span className="text-xs font-medium mt-0.5" style={{ color: ACCENT }}>{act.act_type}</span>}
        {act.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{act.description}</p>}
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5" /> {count} RSVP{count !== 1 ? 's' : ''}
          </span>
          {userId && (
            <Button
              size="sm"
              variant={rsvped ? 'default' : 'outline'}
              disabled={rsvpMutation.isPending}
              onClick={() => rsvpMutation.mutate()}
              className="gap-1.5 rounded-lg h-8 px-3"
              style={rsvped ? { backgroundColor: ACCENT, borderColor: ACCENT } : { borderColor: ACCENT, color: ACCENT }}
            >
              {rsvped ? <Check className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
              {rsvped ? 'Going' : 'RSVP'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}