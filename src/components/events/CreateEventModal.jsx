import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import NeighborhoodSelect from '@/components/shared/NeighborhoodSelect';
import { useToast } from '@/components/ui/use-toast';

const eventCategories = ['music', 'art', 'community', 'nightlife', 'food', 'wellness', 'education', 'activism', 'family', 'sports', 'networking', 'festival', 'other'];

export default function CreateEventModal({ isOpen, onClose }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', date: '', end_date: '', venue_name: '', address: '',
    category: 'community', capacity: '', ticketing_mode: 'rsvp_only',
    neighborhood_id: '', neighborhood_name: '',
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
      return base44.entities.Event.create({
        ...form,
        image_url: imageUrl,
        organizer_id: user.id,
        organizer_name: user.display_name || user.full_name,
        organizer_avatar: user.avatar_url,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        status: 'upcoming',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event created!' });
      onClose();
      setForm({
        title: '', description: '', date: '', end_date: '', venue_name: '', address: '',
        category: 'community', capacity: '', ticketing_mode: 'rsvp_only',
        neighborhood_id: '', neighborhood_name: '',
      });
      setImageFile(null);
      setImagePreview('');
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-lg font-semibold text-foreground">Create Event</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Image */}
              <label className="block">
                <div className="aspect-[16/9] rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Add event flyer</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>

              {/* Title */}
              <div>
                <Label className="text-xs">Event Title</Label>
                <Input value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="What's your event called?" className="mt-1.5 text-sm" />
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Tell people about your event..." className="mt-1.5 min-h-[60px] text-sm" />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date & Time</Label>
                  <Input type="datetime-local" value={form.date} onChange={(e) => updateForm('date', e.target.value)} className="mt-1.5 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">End Date & Time</Label>
                  <Input type="datetime-local" value={form.end_date} onChange={(e) => updateForm('end_date', e.target.value)} className="mt-1.5 text-sm" />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-xs">Venue Name</Label>
                <Input value={form.venue_name} onChange={(e) => updateForm('venue_name', e.target.value)} placeholder="Where is it happening?" className="mt-1.5 text-sm" />
              </div>

              <div>
                <Label className="text-xs">Address</Label>
                <Input value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Full address" className="mt-1.5 text-sm" />
              </div>

              {/* Neighborhood */}
              <div>
                <Label className="text-xs">Neighborhood</Label>
                <div className="mt-1.5">
                  <NeighborhoodSelect
                    value={form.neighborhood_id}
                    onChange={(id, name) => setForm(p => ({ ...p, neighborhood_id: id, neighborhood_name: name }))}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
                  <SelectTrigger className="mt-1.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventCategories.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ticketing Mode */}
              <div>
                <Label className="text-xs">Ticketing Mode</Label>
                <Select value={form.ticketing_mode} onValueChange={(v) => updateForm('ticketing_mode', v)}>
                  <SelectTrigger className="mt-1.5 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsvp_only">RSVP Only</SelectItem>
                    <SelectItem value="platform">Platform Tickets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Capacity */}
              <div>
                <Label className="text-xs">Capacity</Label>
                <Input type="number" value={form.capacity} onChange={(e) => updateForm('capacity', e.target.value)} placeholder="Leave blank for unlimited" className="mt-1.5 text-sm" />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4 flex-shrink-0 flex gap-3 bg-secondary/20">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!form.title || !form.date || createMutation.isPending}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}