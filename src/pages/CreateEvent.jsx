import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Image as ImageIcon, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

const eventCategories = ['music', 'art', 'community', 'nightlife', 'food', 'wellness', 'education', 'activism', 'family', 'sports', 'networking', 'festival', 'other'];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', date: '', end_date: '', venue_name: '', address: '',
    category: 'community', is_free: true, price_range: '', ticket_url: '', capacity: '',
    ticketing_mode: 'external', allow_donations: false,
  });

  useEffect(() => { base44.auth.me().then(setUser); }, []);

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
      navigate('/events');
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold">Create Event</h1>
        <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.date || createMutation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-5">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
        </Button>
      </div>

      <div className="space-y-5">
        {/* Image */}
        <label className="block">
          <div className="aspect-[16/9] rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer flex items-center justify-center">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center"><ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Add event flyer</span></div>
            )}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>

        <div><Label>Event Title</Label><Input value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="What's your event called?" className="mt-1.5" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="Tell people about your event..." className="mt-1.5 min-h-[80px]" /></div>
        
        <div className="grid grid-cols-2 gap-4">
          <div><Label>Start Date & Time</Label><Input type="datetime-local" value={form.date} onChange={(e) => updateForm('date', e.target.value)} className="mt-1.5" /></div>
          <div><Label>End Date & Time</Label><Input type="datetime-local" value={form.end_date} onChange={(e) => updateForm('end_date', e.target.value)} className="mt-1.5" /></div>
        </div>

        <div><Label>Venue Name</Label><Input value={form.venue_name} onChange={(e) => updateForm('venue_name', e.target.value)} placeholder="Where is it happening?" className="mt-1.5" /></div>
        <div><Label>Address</Label><Input value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Full address" className="mt-1.5" /></div>

        <div><Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{eventCategories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div><Label>Ticketing Mode</Label>
          <Select value={form.ticketing_mode} onValueChange={(v) => updateForm('ticketing_mode', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="external">External Link (Eventbrite, etc.)</SelectItem>
              <SelectItem value="rsvp_only">RSVP Only (No Tickets)</SelectItem>
              <SelectItem value="platform">Platform Tickets (Built-in)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.ticketing_mode === 'external' && (
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Price Range</Label><Input value={form.price_range} onChange={(e) => updateForm('price_range', e.target.value)} placeholder="$10-$25" className="mt-1.5" /></div>
            <div><Label>Ticket URL</Label><Input value={form.ticket_url} onChange={(e) => updateForm('ticket_url', e.target.value)} placeholder="https://..." className="mt-1.5" /></div>
          </div>
        )}

        {form.ticketing_mode === 'platform' && (
          <div className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg">
            <Label className="mb-0">Allow Donations</Label>
            <Switch checked={form.allow_donations} onCheckedChange={(v) => updateForm('allow_donations', v)} />
          </div>
        )}

        <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => updateForm('capacity', e.target.value)} placeholder="Leave blank for unlimited" className="mt-1.5" /></div>
      </div>
    </div>
  );
}