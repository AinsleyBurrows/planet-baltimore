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

const TYPES = [
  ['artist', 'Artist'],
  ['curator', 'Curator'],
  ['art_organization', 'Art Org'],
];

export default function AddParticipantModal({ fairId, open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [participantType, setParticipantType] = useState('artist');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
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
      return base44.entities.ArtFairParticipant.create({
        art_fair_id: fairId,
        name: name.trim(),
        participant_type: participantType,
        role: role.trim(),
        description: description.trim(),
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-fair-participants'] });
      toast({ title: 'Participant added', description: `${name} added to this art fair.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to add participant', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Image</Label>
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
            <Label className="mb-1.5 block">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe / Bmore Arts Org" />
          </div>
          <div>
            <Label className="mb-1.5 block">Type</Label>
            <div className="flex gap-1 p-1 bg-secondary/60 rounded-lg w-fit">
              {TYPES.map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setParticipantType(val)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${participantType === val ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Role / Title (optional)</Label>
            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Featured Painter, Curator-in-Residence" />
          </div>
          <div>
            <Label className="mb-1.5 block">About (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Tell people about this participant..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending} className="gap-2" style={{ backgroundColor: ACCENT }}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Participant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}