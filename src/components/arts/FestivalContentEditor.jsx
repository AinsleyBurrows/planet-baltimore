import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

/**
 * Admin-only editor for populating a festival sub-tab with editable content.
 * Props:
 *  - programKey: the sub-tab identifier (e.g. 'flavor_lab')
 *  - defaultTitle: fallback label
 *  - defaultDescription: fallback description
 *  - open, onOpenChange
 */
export default function FestivalContentEditor({ programKey, defaultTitle, defaultDescription, open, onOpenChange }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Load existing content for this program
  const { data: existing, isLoading } = useQuery({
    queryKey: ['festival-content', programKey],
    queryFn: () => base44.entities.FestivalContent.filter({ program_key: programKey }, '-updated_date', 1),
    enabled: open && !!programKey,
    staleTime: 0,
  });

  const record = existing && existing[0];

  useEffect(() => {
    if (record) {
      setTitle(record.title || '');
      setSubtitle(record.subtitle || '');
      setDescription(record.description || '');
      setBannerUrl(record.banner_url || '');
      setBannerPreview(record.banner_url || '');
      setBodyHtml(record.body_html || '');
      setIsPublished(record.is_published !== false);
    } else {
      setTitle(defaultTitle || '');
      setSubtitle('');
      setDescription(defaultDescription || '');
      setBannerUrl('');
      setBannerPreview('');
      setBodyHtml('');
      setIsPublished(true);
    }
    setBannerFile(null);
  }, [record, defaultTitle, defaultDescription, open]);

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let finalBanner = bannerUrl;
      if (bannerFile) {
        const result = await base44.integrations.Core.UploadFile({ file: bannerFile });
        finalBanner = result.file_url;
      }
      const payload = {
        program_key: programKey,
        title: title.trim() || defaultTitle,
        subtitle: subtitle.trim(),
        description: description.trim(),
        banner_url: finalBanner,
        body_html: bodyHtml,
        is_published: isPublished,
      };
      if (record) {
        return base44.entities.FestivalContent.update(record.id, payload);
      }
      return base44.entities.FestivalContent.create({ ...payload, updated_by: '' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festival-content', programKey] });
      toast({ title: 'Content saved', description: `${defaultTitle} content updated.` });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Save failed', description: err.message });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit "{defaultTitle}" Content</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Banner image */}
            <div>
              <Label className="mb-1.5 block">Banner Image</Label>
              {bannerPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border h-32 mb-2">
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border h-32 flex items-center justify-center text-muted-foreground mb-2">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <label className="inline-flex items-center gap-1.5 text-sm text-accent cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{bannerPreview ? 'Replace image' : 'Upload image'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
              </label>
            </div>

            {/* Title */}
            <div>
              <Label className="mb-1.5 block">Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={defaultTitle} />
            </div>

            {/* Subtitle */}
            <div>
              <Label className="mb-1.5 block">Subtitle / Tagline</Label>
              <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="A short tagline" />
            </div>

            {/* Description */}
            <div>
              <Label className="mb-1.5 block">Short Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={defaultDescription} rows={3} />
            </div>

            {/* Rich body */}
            <div>
              <Label className="mb-1.5 block">Full Details (rich text)</Label>
              <div className="editor-wrapper border border-border rounded-lg p-3 bg-card">
                <ReactQuill
                  theme="snow"
                  value={bodyHtml}
                  onChange={setBodyHtml}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link', 'blockquote'],
                      ['clean'],
                    ],
                  }}
                  placeholder="Add schedule, highlights, participants, sponsors, and other details..."
                />
              </div>
            </div>

            {/* Published toggle */}
            <div className="flex items-center gap-2">
              <Switch checked={isPublished} onCheckedChange={setIsPublished} id="fc-published" />
              <Label htmlFor="fc-published" className="cursor-pointer">Published (visible to public)</Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || isLoading} className="gap-2">
            {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {record ? 'Save Changes' : 'Publish Content'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}