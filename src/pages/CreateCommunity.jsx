import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NeighborhoodSelect from '@/components/shared/NeighborhoodSelect';
import { ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const categories = ['neighborhood', 'arts', 'activism', 'wellness', 'education', 'business', 'social', 'sports', 'faith', 'civic', 'other'];

export default function CreateCommunity() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({ name: '', description: '', category: 'neighborhood', website: '', contact_email: '', neighborhood_id: '', neighborhood_name: '' });

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = '';
      if (imageFile) {
        const result = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = result.file_url;
      }
      return base44.entities.Community.create({ ...form, image_url: imageUrl, owner_id: user.id, owner_name: user.display_name || user.full_name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities'] });
      toast({ title: 'Community created!' });
      navigate('/communities');
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold">Create Community</h1>
        <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-5">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
        </Button>
      </div>

      <div className="space-y-5">
        <label className="block">
          <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 cursor-pointer flex items-center justify-center">
            {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}} />
        </label>

        <div><Label>Community Name</Label><Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Name your community" className="mt-1.5" /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} placeholder="What is this community about?" className="mt-1.5 min-h-[80px]" /></div>
        <div><Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Neighborhood (optional)</Label>
          <div className="mt-1.5">
            <NeighborhoodSelect
              value={form.neighborhood_id}
              onChange={(id, name) => setForm(p => ({ ...p, neighborhood_id: id, neighborhood_name: name }))}
            />
          </div>
        </div>
        <div><Label>Website (optional)</Label><Input value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://..." className="mt-1.5" /></div>
        <div><Label>Contact Email (optional)</Label><Input value={form.contact_email} onChange={(e) => updateForm('contact_email', e.target.value)} placeholder="email@example.com" className="mt-1.5" /></div>
      </div>
    </div>
  );
}