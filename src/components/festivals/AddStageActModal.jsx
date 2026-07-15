import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#d4580a';

export default function AddStageActModal({ stageId, act, open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(act?.name || '');
  const [actType, setActType] = useState(act?.act_type || '');
  const [description, setDescription] = useState(act?.description || '');
  const [performanceTime, setPerformanceTime] = useState(act?.performance_time || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(act?.image_url || '');

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = act?.image_url || '';
      if (imageFile) {
        const result = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = result.file_url;
      }
      const payload = {
        name: name.trim(),
        act_type: actType.trim(),
        description: description.trim(),
        performance_time: performanceTime.trim(),
        image_url: imageUrl,
      };
      if (act) return base44.entities.OtherStageAct.update(act.id, payload);
      return base44.entities.OtherStageAct.create({ ...payload, stage_id: stageId, rsvp_count: 0, rsvped_user_ids: [] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['other-stage-acts'] });
      toast({ title: act ? 'Act updated' : 'Act added', description: act ? `${name} has been updated.` : `${name} added to this stage.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to save act', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{act ? 'Edit Act' : 'Add an Act to this Stage'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Act Image</Label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-square w-36 mb-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border aspect-square w-36 flex items-center justify-center text-muted-foreground mb-2">
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
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Harbor Drummers" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Type of Act</Label>
              <Input value={actType} onChange={e => setActType(e.target.value)} placeholder="e.g. Band, DJ" />
            </div>
            <div>
              <Label className="mb-1.5 block">Time (optional)</Label>
              <Input value={performanceTime} onChange={e => setPerformanceTime(e.target.value)} placeholder="e.g. 7:30 PM" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">About the Act</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people about this act..." rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending} className="gap-2" style={{ backgroundColor: ACCENT }}>
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {act ? 'Save Changes' : 'Add Act'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}