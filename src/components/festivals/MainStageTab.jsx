import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Upload, Image as ImageIcon, Sparkles, Ticket, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const ACCENT = '#d4580a';

export default function MainStageTab() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: acts = [], isLoading } = useQuery({
    queryKey: ['main-stage-acts'],
    queryFn: () => base44.entities.MainStageAct.list('sort_order', 100),
    staleTime: 30000,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ act, rsvped }) => {
      const ids = act.rsvped_user_ids || [];
      const newIds = rsvped ? ids.filter(id => id !== user.id) : [...ids, user.id];
      return base44.entities.MainStageAct.update(act.id, { rsvped_user_ids: newIds, rsvp_count: newIds.length });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['main-stage-acts'] }),
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-5 bg-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Main Stage</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">The festival's headline stage. Browse the acts and RSVP to the ones you want to see.</p>
          </div>
          {user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdd(true)}
              className="gap-1.5 rounded-lg flex-shrink-0"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              <Plus className="w-4 h-4" /> Add Act
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : acts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No acts added yet</h3>
          <p className="text-sm text-muted-foreground">Add the first act to the Main Stage line-up.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {acts.map(act => (
            <ActCard
              key={act.id}
              act={act}
              userId={user?.id}
              onRsvp={(rsvped) => rsvpMutation.mutate({ act, rsvped })}
              pending={rsvpMutation.isPending}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddActModal open={showAdd} onOpenChange={setShowAdd} />
      )}
    </div>
  );
}

function ActCard({ act, userId, onRsvp, pending }) {
  const rsvped = userId && (act.rsvped_user_ids || []).includes(userId);
  const count = act.rsvp_count || 0;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {act.image_url ? (
        <div className="h-44 w-full overflow-hidden bg-muted">
          <img src={act.image_url} alt={act.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-44 w-full bg-secondary flex items-center justify-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-foreground">{act.name}</h3>
          {act.performance_time && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground whitespace-nowrap">{act.performance_time}</span>
          )}
        </div>
        {act.act_type && (
          <span className="text-xs font-medium text-accent mt-0.5">{act.act_type}</span>
        )}
        {act.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-4">{act.description}</p>
        )}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5" /> {count} RSVP{count !== 1 ? 's' : ''}
          </span>
          {userId && (
            <Button
              size="sm"
              variant={rsvped ? 'default' : 'outline'}
              disabled={pending}
              onClick={() => onRsvp(rsvped)}
              className="gap-1.5 rounded-lg"
              style={rsvped ? { backgroundColor: ACCENT, borderColor: ACCENT } : { borderColor: ACCENT, color: ACCENT }}
            >
              {rsvped ? <Check className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
              {rsvped ? 'Going' : 'RSVP'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddActModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [actType, setActType] = useState('');
  const [description, setDescription] = useState('');
  const [performanceTime, setPerformanceTime] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = '';
      if (imageFile) {
        const result = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = result.file_url;
      }
      return base44.entities.MainStageAct.create({
        name: name.trim(),
        act_type: actType.trim(),
        description: description.trim(),
        performance_time: performanceTime.trim(),
        image_url: imageUrl,
        rsvp_count: 0,
        rsvped_user_ids: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['main-stage-acts'] });
      toast({ title: 'Act added', description: `${name} is now on the Main Stage line-up.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to add act', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Main Stage Act</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Act Image</Label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border h-36 mb-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border h-36 flex items-center justify-center text-muted-foreground mb-2">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: ACCENT }}>
              <Upload className="w-4 h-4" />
              <span>{imagePreview ? 'Replace image' : 'Upload image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          </div>
          <div>
            <Label className="mb-1.5 block">Act Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Baltimore Brass" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Type of Act</Label>
              <Input value={actType} onChange={e => setActType(e.target.value)} placeholder="e.g. Band, DJ, Dance" />
            </div>
            <div>
              <Label className="mb-1.5 block">Time (optional)</Label>
              <Input value={performanceTime} onChange={e => setPerformanceTime(e.target.value)} placeholder="e.g. 9:00 PM" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">About the Act</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people about this act..." rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending} className="gap-2" style={{ backgroundColor: ACCENT }}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Act
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}