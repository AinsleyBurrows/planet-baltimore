import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import ReactQuill from 'react-quill';

const categories = ['blog', 'newsletter', 'essay', 'announcement', 'event_recap', 'resource'];

export default function CreateStory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [form, setForm] = useState({ title: '', subtitle: '', content: '', category: 'blog' });

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const estimateReadTime = (html) => {
    const text = html?.replace(/<[^>]*>/g, '') || '';
    return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
  };

  const createMutation = useMutation({
    mutationFn: async (status) => {
      let coverUrl = '';
      if (coverFile) {
        const result = await base44.integrations.Core.UploadFile({ file: coverFile });
        coverUrl = result.file_url;
      }
      return base44.entities.Story.create({
        ...form,
        cover_image: coverUrl,
        author_id: user.id,
        author_name: user.display_name || user.full_name,
        author_avatar: user.avatar_url,
        status,
        published_at: status === 'published' ? new Date().toISOString() : undefined,
        reading_time: estimateReadTime(form.content),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({ title: 'Zine saved!' });
      navigate('/stories');
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-semibold">Write a Zine</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => createMutation.mutate('draft')} disabled={!form.title || createMutation.isPending} className="rounded-lg">
            Save Draft
          </Button>
          <Button onClick={() => createMutation.mutate('published')} disabled={!form.title || createMutation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Cover Image */}
        <label className="block">
          <div className="aspect-[2/1] rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 cursor-pointer flex items-center justify-center">
            {coverPreview ? <img src={coverPreview} alt="" className="w-full h-full object-cover" /> :
              <div className="text-center"><ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" /><span className="text-sm text-muted-foreground">Add cover image</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }}} />
        </label>

        <Input value={form.title} onChange={(e) => updateForm('title', e.target.value)} placeholder="Your zine title..." className="text-2xl font-serif font-bold border-0 bg-transparent h-auto py-2 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40" />
        <Input value={form.subtitle} onChange={(e) => updateForm('subtitle', e.target.value)} placeholder="A brief subtitle..." className="text-lg border-0 bg-transparent h-auto py-1 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/40" />

        <div><Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
            <SelectTrigger className="mt-1.5 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="min-h-[300px]">
          <ReactQuill value={form.content} onChange={(v) => updateForm('content', v)} placeholder="Start writing your zine..." theme="snow" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}