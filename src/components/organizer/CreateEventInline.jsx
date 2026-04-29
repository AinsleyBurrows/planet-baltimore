import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Image as ImageIcon, CheckCircle } from 'lucide-react';
import NeighborhoodSelect from '@/components/shared/NeighborhoodSelect';

const eventCategories = ['music', 'art', 'community', 'nightlife', 'food', 'wellness', 'education', 'activism', 'family', 'sports', 'networking', 'festival', 'other'];

const defaultForm = {
  title: '', description: '', date: '', end_date: '', venue_name: '', address: '',
  category: 'community', capacity: '',
  ticketing_mode: 'rsvp_only', allow_donations: false,
  neighborhood_id: '', neighborhood_name: '',
};

export default function CreateEventInline({ currentUser, onCreated }) {
  const { toast } = useToast();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [success, setSuccess] = useState(false);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
        organizer_id: currentUser.id,
        organizer_name: currentUser.display_name || currentUser.full_name,
        organizer_avatar: currentUser.avatar_url,
        capacity: form.capacity ? parseInt(form.capacity) : undefined,
        status: 'upcoming',
      });
    },
    onSuccess: (event) => {
      toast({ title: 'Event created!' });
      setSuccess(true);
      setForm(defaultForm);
      setImageFile(null);
      setImagePreview('');
      onCreated?.(event);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  if (success) {
    return (
      <div className="text-center py-16 bg-card border border-border rounded-xl">
        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
        <p className="font-semibold text-foreground mb-1">Event created successfully!</p>
        <p className="text-sm text-muted-foreground">It now appears in your events list.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 max-w-lg mx-auto space-y-5">
      <h2 className="text-lg font-semibold text-foreground">New Event</h2>

      {/* Image */}
      <label className="block cursor-pointer">
        <div className="aspect-[16/9] rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
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

      <div><Label>Event Title</Label><Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="What's your event called?" className="mt-1.5" /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell people about your event..." className="mt-1.5 min-h-[80px]" /></div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label>Start Date & Time</Label><Input type="datetime-local" value={form.date} onChange={e => update('date', e.target.value)} className="mt-1.5" /></div>
        <div><Label>End Date & Time</Label><Input type="datetime-local" value={form.end_date} onChange={e => update('end_date', e.target.value)} className="mt-1.5" /></div>
      </div>

      <div><Label>Venue Name</Label><Input value={form.venue_name} onChange={e => update('venue_name', e.target.value)} placeholder="Where is it happening?" className="mt-1.5" /></div>
      <div><Label>Address</Label><Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Full address" className="mt-1.5" /></div>

      <div>
        <Label>Neighborhood</Label>
        <div className="mt-1.5">
          <NeighborhoodSelect
            value={form.neighborhood_id}
            onChange={(id, name) => setForm(p => ({ ...p, neighborhood_id: id, neighborhood_name: name }))}
          />
        </div>
      </div>

      <div><Label>Category</Label>
        <Select value={form.category} onValueChange={v => update('category', v)}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>{eventCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div><Label>Ticketing Mode</Label>
        <Select value={form.ticketing_mode} onValueChange={v => update('ticketing_mode', v)}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rsvp_only">RSVP Only</SelectItem>
            <SelectItem value="platform">Platform Tickets</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.ticketing_mode === 'platform' && (
        <div className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg">
          <Label className="mb-0">Allow Donations</Label>
          <Switch checked={form.allow_donations} onCheckedChange={v => update('allow_donations', v)} />
        </div>
      )}

      <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={e => update('capacity', e.target.value)} placeholder="Leave blank for unlimited" className="mt-1.5" /></div>

      <Button
        onClick={() => createMutation.mutate()}
        disabled={!form.title || !form.date || createMutation.isPending}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
      >
        {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Event'}
      </Button>
    </div>
  );
}