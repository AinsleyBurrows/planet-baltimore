import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#d4580a';

export default function AddConversationModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
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
      return base44.entities.Conversation.create({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        scheduled_time: scheduledTime.trim(),
        image_url: imageUrl,
        rsvp_count: 0,
        rsvped_user_ids: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({ title: 'Conversation added', description: `${title} has been added.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to add conversation', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Conversation Panel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Image</Label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-border aspect-video w-full mb-2">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border aspect-video w-full flex items-center justify-center text-muted-foreground mb-2">
                <MessageSquare className="w-8 h-8" />
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: ACCENT }}>
              <Upload className="w-4 h-4" />
              <span>{imagePreview ? 'Replace image' : 'Upload image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          </div>
          <div>
            <Label className="mb-1.5 block">Panel Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. The Future of Baltimore Art" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Location / Stage (optional)</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Talk Tent" />
            </div>
            <div>
              <Label className="mb-1.5 block">Time (optional)</Label>
              <Input value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} placeholder="e.g. 3:00 PM" />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What will this conversation cover?" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || createMutation.isPending} className="gap-2" style={{ backgroundColor: ACCENT }}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Conversation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}