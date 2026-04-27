import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NeighborhoodSelect from '@/components/shared/NeighborhoodSelect';
import { ArrowLeft, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const ORG_TYPES = [
  { value: 'museum', label: 'Museum' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'studio_space', label: 'Artist Studio Space' },
  { value: 'collective', label: 'Artist Collective' },
  { value: 'residency', label: 'Residency Program' },
  { value: 'nonprofit', label: 'Arts Nonprofit' },
  { value: 'cultural_institution', label: 'Cultural Institution' },
  { value: 'performance_space', label: 'Performance Space' },
  { value: 'community_art_space', label: 'Community Art Space' },
  { value: 'diy_space', label: 'DIY / Alternative Space' },
  { value: 'art_school', label: 'Art School / Education' },
  { value: 'other', label: 'Other' },
];

export default function CreateArtsOrg() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', mission: '',
    org_type: '', address: '', neighborhood_id: '', neighborhood_name: '',
    website: '', phone: '', hours: '',
  });

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      let image_url = '';
      if (imageFile) {
        const res = await base44.integrations.Core.UploadFile({ file: imageFile });
        image_url = res.file_url;
      }
      return base44.entities.ArtsOrganization.create({
        ...form,
        image_url,
        owner_id: user.id,
        owner_name: user.display_name || user.full_name,
      });
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['arts-orgs'] });
      toast({ title: 'Arts organization created!' });
      navigate(`/arts-organizations/${org.id}`);
    },
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.name && form.org_type;

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Create Arts Organization</h1>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending || !user}
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
        >
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
        </Button>
      </div>

      {/* Image */}
      <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer bg-secondary/20 overflow-hidden">
        {imagePreview ? (
          <img src={imagePreview} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center"><ImagePlus className="w-8 h-8 mx-auto text-muted-foreground mb-1" /><span className="text-sm text-muted-foreground">Add logo or photo</span></div>
        )}
        <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </label>

      <div className="space-y-4">
        <Input placeholder="Organization name *" value={form.name} onChange={e => update('name', e.target.value)} className="rounded-xl" />
        <Input placeholder="Tagline (optional)" value={form.tagline} onChange={e => update('tagline', e.target.value)} className="rounded-xl" />

        <Select value={form.org_type} onValueChange={v => update('org_type', v)}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Organization type *" /></SelectTrigger>
          <SelectContent>
            {ORG_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Textarea placeholder="Description" value={form.description} onChange={e => update('description', e.target.value)} className="rounded-xl resize-none" rows={3} />
        <Textarea placeholder="Mission statement (optional)" value={form.mission} onChange={e => update('mission', e.target.value)} className="rounded-xl resize-none" rows={3} />

        <NeighborhoodSelect
          value={form.neighborhood_id}
          onChange={(id, name) => setForm(f => ({ ...f, neighborhood_id: id, neighborhood_name: name }))}
          className="rounded-xl"
        />
        <Input placeholder="Address" value={form.address} onChange={e => update('address', e.target.value)} className="rounded-xl" />
        <Input placeholder="Website" value={form.website} onChange={e => update('website', e.target.value)} className="rounded-xl" />
        <Input placeholder="Phone" value={form.phone} onChange={e => update('phone', e.target.value)} className="rounded-xl" />
        <Input placeholder="Hours (e.g. Tue–Sun, 10am–5pm)" value={form.hours} onChange={e => update('hours', e.target.value)} className="rounded-xl" />
      </div>
    </div>
  );
}