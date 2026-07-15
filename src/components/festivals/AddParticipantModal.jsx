import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#d4580a';

export default function AddParticipantModal({ open, onOpenChange, conversationId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
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
      return base44.entities.ConversationParticipant.create({
        conversation_id: conversationId,
        name: name.trim(),
        role: role.trim(),
        bio: bio.trim(),
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-participants', conversationId] });
      toast({ title: 'Participant added', description: name });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to add participant', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Image</Label>
            {imagePreview ? (
              <div className="relative rounded-full overflow-hidden border border-border w-20 h-20 mb-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-full border border-dashed border-border w-20 h-20 flex items-center justify-center text-muted-foreground mb-2">
                <User className="w-8 h-8" />
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
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ainsley Burrows" />
          </div>
          <div>
            <Label className="mb-1.5 block">Role / Title (optional)</Label>
            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Moderator" />
          </div>
          <div>
            <Label className="mb-1.5 block">Bio (optional)</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Short bio" />
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