import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Palette, Ticket, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ParticipantCard from '@/components/festivals/ParticipantCard';
import AddParticipantModal from '@/components/festivals/AddParticipantModal';

const ACCENT = '#d4580a';

export default function ArtFairTab() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showAddFair, setShowAddFair] = useState(false);
  const [addParticipantForFair, setAddParticipantForFair] = useState(null);

  const { data: fairs = [], isLoading } = useQuery({
    queryKey: ['art-fairs'],
    queryFn: () => base44.entities.ArtFair.list('sort_order', 100),
    staleTime: 30000,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['art-fair-participants'],
    queryFn: () => base44.entities.ArtFairParticipant.list('sort_order', 300),
    staleTime: 30000,
  });

  const partsForFair = (fairId) => participants.filter(p => p.art_fair_id === fairId);

  const rsvpMutation = useMutation({
    mutationFn: async ({ fair, rsvped }) => {
      const ids = fair.rsvped_user_ids || [];
      const newIds = rsvped ? ids.filter(id => id !== user.id) : [...ids, user.id];
      return base44.entities.ArtFair.update(fair.id, { rsvped_user_ids: newIds, rsvp_count: newIds.length });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['art-fairs'] }),
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-5 bg-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Art Fair</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">Name an art fair, showcase the artists, curators, and organizations in it, and let people RSVP.</p>
          </div>
          {user && (
            <Button variant="outline" size="sm" onClick={() => setShowAddFair(true)} className="gap-1.5 rounded-lg flex-shrink-0" style={{ borderColor: ACCENT, color: ACCENT }}>
              <Plus className="w-4 h-4" /> Add Art Fair
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : fairs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Palette className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No art fairs yet</h3>
          <p className="text-sm text-muted-foreground">Add an art fair to start showcasing its participants.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {fairs.map(fair => (
            <FairSection
              key={fair.id}
              fair={fair}
              participants={partsForFair(fair.id)}
              userId={user?.id}
              onRsvp={(rsvped) => rsvpMutation.mutate({ fair, rsvped })}
              rsvpPending={rsvpMutation.isPending}
              onAddParticipant={() => setAddParticipantForFair(fair.id)}
            />
          ))}
        </div>
      )}

      {showAddFair && <AddArtFairModal open={showAddFair} onOpenChange={setShowAddFair} />}
      {addParticipantForFair && (
        <AddParticipantModal
          fairId={addParticipantForFair}
          open={!!addParticipantForFair}
          onOpenChange={(o) => !o && setAddParticipantForFair(null)}
        />
      )}
    </div>
  );
}

function FairSection({ fair, participants, userId, onRsvp, rsvpPending, onAddParticipant }) {
  const rsvped = userId && (fair.rsvped_user_ids || []).includes(userId);
  const count = fair.rsvp_count || 0;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
            <span className="truncate">{fair.name}</span>
          </h3>
          {fair.description && <p className="text-sm text-muted-foreground mt-0.5">{fair.description}</p>}
        </div>
        {userId && (
          <Button
            size="sm"
            variant={rsvped ? 'default' : 'outline'}
            disabled={rsvpPending}
            onClick={() => onRsvp(rsvped)}
            className="gap-1.5 rounded-lg flex-shrink-0"
            style={rsvped ? { backgroundColor: ACCENT, borderColor: ACCENT } : { borderColor: ACCENT, color: ACCENT }}
          >
            {rsvped ? <Check className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
            {rsvped ? 'Going' : 'RSVP'}
          </Button>
        )}
      </div>
      <div className="px-4 pt-3 flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Ticket className="w-3.5 h-3.5" /> {count} RSVP{count !== 1 ? 's' : ''} • {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </span>
        {userId && (
          <Button variant="outline" size="sm" onClick={onAddParticipant} className="gap-1.5 rounded-lg" style={{ borderColor: ACCENT, color: ACCENT }}>
            <Plus className="w-4 h-4" /> Add Participant
          </Button>
        )}
      </div>
      <div className="p-4">
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No participants added yet — add artists, curators, or organizations.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {participants.map(p => <ParticipantCard key={p.id} participant={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function AddArtFairModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () => base44.entities.ArtFair.create({ name: name.trim(), description: description.trim(), rsvp_count: 0, rsvped_user_ids: [] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-fairs'] });
      toast({ title: 'Art Fair added', description: `${name} is ready for participants.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to add art fair', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add an Art Fair</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Art Fair Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Station North Art Fair" />
          </div>
          <div>
            <Label className="mb-1.5 block">Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Tell people about this art fair..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending} style={{ backgroundColor: ACCENT }}>
            Add Art Fair
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}