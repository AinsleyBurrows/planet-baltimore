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
// NeighborhoodSelect is used for neighborhood picker
import { useToast } from '@/components/ui/use-toast';

const categories = ['visual_art', 'music', 'video', 'photography', 'performance', 'literary', 'mixed_media', 'digital', 'fashion', 'other'];

export default function CreateArtist() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({ name: '', bio: '', category: 'visual_art', website: '', neighborhood_id: '', neighborhood_name: '' });

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      let imageUrl = '';
      if (imageFile) {
        const result = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = result.file_url;
      }
      return base44.entities.ArtistPage.create({ ...form, image_url: imageUrl, owner_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      toast({ title: 'Artist page created!' });
      navigate('/artists');
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold">Create Artist Page</h1>
        <Button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-5">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
        </Button>
      </div>

      <div className="space-y-5">
        <label className="block">
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 cursor-pointer flex items-center justify-center">
            {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}} />
        </label>

        <div><Label>Artist Name</Label><Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Your artist name" className="mt-1.5" /></div>
        <div><Label>Bio</Label><Textarea value={form.bio} onChange={(e) => updateForm('bio', e.target.value)} placeholder="Tell people about your art..." className="mt-1.5 min-h-[80px]" /></div>
        <div><Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Neighborhood</Label>
          <div className="mt-1.5">
            <NeighborhoodSelect
              value={form.neighborhood_id}
              onChange={(id, name) => setForm(p => ({ ...p, neighborhood_id: id, neighborhood_name: name }))}
            />
          </div>
        </div>
        <div><Label>Website (optional)</Label><Input value={form.website} onChange={(e) => updateForm('website', e.target.value)} placeholder="https://..." className="mt-1.5" /></div>
      </div>
    </div>
  );
}