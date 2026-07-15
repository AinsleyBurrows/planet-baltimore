import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Music2, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import StageActCard from '@/components/festivals/StageActCard';
import AddStageActModal from '@/components/festivals/AddStageActModal';

const ACCENT = '#d4580a';

export default function OtherStagesTab() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showAddStage, setShowAddStage] = useState(false);
  const [addActForStage, setAddActForStage] = useState(null);

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['other-stages'],
    queryFn: () => base44.entities.OtherStage.list('sort_order', 100),
    staleTime: 30000,
  });

  const { data: acts = [] } = useQuery({
    queryKey: ['other-stage-acts'],
    queryFn: () => base44.entities.OtherStageAct.list('sort_order', 200),
    staleTime: 30000,
  });

  const actsByStage = (stageId) => acts.filter(a => a.stage_id === stageId);

  const deleteStageMutation = useMutation({
    mutationFn: (stage) => base44.entities.OtherStage.delete(stage.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['other-stages'] }),
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-5 bg-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Other Stages</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">Name your festival's other stages, add the acts on each, and let people RSVP per act.</p>
          </div>
          {user && (
            <Button variant="outline" size="sm" onClick={() => setShowAddStage(true)} className="gap-1.5 rounded-lg flex-shrink-0" style={{ borderColor: ACCENT, color: ACCENT }}>
              <Plus className="w-4 h-4" /> Add Stage
            </Button>
          )}
        </div>
      </div>

      {stagesLoading ? (
        <div className="space-y-4">
          {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No stages yet</h3>
          <p className="text-sm text-muted-foreground">Add a stage and start building its line-up.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {stages.map(stage => (
            <div key={stage.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Music2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                    <span className="truncate">{stage.name}</span>
                  </h3>
                  {stage.description && <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>}
                </div>
                {user && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setAddActForStage(stage.id)} className="gap-1.5 rounded-lg" style={{ borderColor: ACCENT, color: ACCENT }}>
                      <Plus className="w-4 h-4" /> Add Act
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteStageMutation.mutate(stage)} className="text-muted-foreground hover:text-destructive h-9 w-9">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-4">
                {actsByStage(stage.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No acts on this stage yet — add the first one.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {actsByStage(stage.id).map(act => (
                      <StageActCard key={act.id} act={act} userId={user?.id} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddStage && <AddStageModal open={showAddStage} onOpenChange={setShowAddStage} />}
      {addActForStage && (
        <AddStageActModal
          stageId={addActForStage}
          open={!!addActForStage}
          onOpenChange={(o) => !o && setAddActForStage(null)}
        />
      )}
    </div>
  );
}

function AddStageModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createMutation = useMutation({
    mutationFn: () => base44.entities.OtherStage.create({ name: name.trim(), description: description.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['other-stages'] });
      toast({ title: 'Stage added', description: `${name} is ready for acts.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to add stage', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a Stage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Stage Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Groove Stage" />
          </div>
          <div>
            <Label className="mb-1.5 block">Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What kind of acts are on this stage?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending} style={{ backgroundColor: ACCENT }}>
            Add Stage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}