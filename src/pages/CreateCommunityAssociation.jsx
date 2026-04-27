import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function CreateCommunityAssociation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', neighborhood_id: '', neighborhood_name: '',
    address: '', website: '', contact_email: '', phone: '',
  });

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods-list'],
    queryFn: () => base44.entities.Neighborhood.list('name', 100),
  });

  const handleNeighborhoodChange = (id) => {
    const found = neighborhoods.find(n => n.id === id);
    setForm(f => ({ ...f, neighborhood_id: id, neighborhood_name: found?.name || '' }));
  };
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let image_url = '';
      if (imageFile) {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = res.file_url;
      }
      return base44.entities.CommunityAssociation.create({
        ...form,
        owner_id: user.id,
        owner_name: user.full_name,
        image_url,
        admins: [user.id],
        is_official: false,
        members_count: 0,
      });
    },
    onSuccess: (assoc) => {
      toast({ title: 'Association created!' });
      navigate(`/community-associations/${assoc.id}`);
    },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Create Neighborhood Association</h1>
          <p className="text-sm text-muted-foreground">Set up your official community hub</p>
        </div>
      </div>

      {/* Logo upload */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-primary/30">
          {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <Building className="w-8 h-8 text-primary/40" />}
        </div>
        <label className="cursor-pointer">
          <span className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors">
            <Upload className="w-4 h-4" />Upload Logo
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Association Name *</Label>
          <Input className="mt-1" placeholder="e.g. Hampden Community Association" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <Label>Tagline</Label>
          <Input className="mt-1" placeholder="Short motto or mission statement" value={form.tagline} onChange={e => set('tagline', e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea className="mt-1" rows={4} placeholder="Tell residents about this association..." value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Neighborhood</Label>
            <Select value={form.neighborhood_id} onValueChange={handleNeighborhoodChange}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select neighborhood…" /></SelectTrigger>
              <SelectContent>
                {neighborhoods.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Address</Label>
            <Input className="mt-1" placeholder="Meeting address" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input className="mt-1" type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input className="mt-1" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Website</Label>
            <Input className="mt-1" placeholder="https://..." value={form.website} onChange={e => set('website', e.target.value)} />
          </div>
        </div>
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !form.name || !user}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-xl"
      >
        {mutation.isPending ? 'Creating...' : 'Create Association'}
      </Button>
    </div>
  );
}