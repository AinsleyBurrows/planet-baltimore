import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

const ACCENT = '#d4580a';

const TYPES = [
  ['jewelry', 'Jewelry'],
  ['pottery', 'Pottery'],
  ['painting', 'Painting'],
  ['print', 'Print'],
  ['textile', 'Textile'],
  ['woodwork', 'Woodwork'],
  ['glass', 'Glass'],
  ['leather', 'Leather'],
  ['candle', 'Candle'],
  ['soap', 'Soap'],
  ['photography', 'Photography'],
  ['sculpture', 'Sculpture'],
  ['mixed_media', 'Mixed Media'],
  ['other', 'Other'],
];

export default function AddArtVendorModal({ open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [vendorType, setVendorType] = useState('other');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
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
      return base44.entities.ArtVendor.create({
        name: name.trim(),
        vendor_type: vendorType,
        description: description.trim(),
        website: website.trim(),
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['art-vendors'] });
      toast({ title: 'Vendor added', description: `${name} has been added.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ variant: 'destructive', title: 'Failed to add vendor', description: err.message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add an Art Vendor</DialogTitle>
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
                <Palette className="w-8 h-8" />
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: ACCENT }}>
              <Upload className="w-4 h-4" />
              <span>{imagePreview ? 'Replace image' : 'Upload image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
          </div>
          <div>
            <Label className="mb-1.5 block">Vendor Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Baltimore Glassworks" />
          </div>
          <div>
            <Label className="mb-1.5 block">Kind of Vendor</Label>
            <div className="flex flex-wrap gap-1 p-1 bg-secondary/60 rounded-lg w-fit max-w-full">
              {TYPES.map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setVendorType(val)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${vendorType === val ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">About (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What do they make?" />
          </div>
          <div>
            <Label className="mb-1.5 block">Shop / Website (optional)</Label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending} className="gap-2" style={{ backgroundColor: ACCENT }}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}