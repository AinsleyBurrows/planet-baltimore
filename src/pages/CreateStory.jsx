import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Image as ImageIcon, ChevronDown, Clock, Eye, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import ReactQuill from 'react-quill';
import { format } from 'date-fns';

const categories = ['blog', 'newsletter', 'essay', 'announcement', 'event_recap', 'resource', 'poetry', 'novel', 'song'];

export default function CreateStory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [form, setForm] = useState({ title: '', subtitle: '', content: '', category: 'blog' });
  const [existingStory, setExistingStory] = useState(null);
  const [publishDate, setPublishDate] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);

  const storyId = new URLSearchParams(window.location.search).get('id');

  useEffect(() => { 
    base44.auth.me().then(setUser);
    if (storyId) {
      base44.entities.Story.filter({ id: storyId }).then(results => {
        if (results[0]) {
          const story = results[0];
          setExistingStory(story);
          setForm({
            title: story.title || '',
            subtitle: story.subtitle || '',
            content: story.content || '',
            category: story.category || 'blog',
          });
          if (story.cover_image) setCoverPreview(story.cover_image);
        }
      });
    }
  }, [storyId]);

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const estimateReadTime = (html) => {
    const text = html?.replace(/<[^>]*>/g, '') || '';
    return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
  };

  const createMutation = useMutation({
    mutationFn: async (status, scheduledDate = null) => {
      let coverUrl = coverPreview;
      if (coverFile) {
        const result = await base44.integrations.Core.UploadFile({ file: coverFile });
        coverUrl = result.file_url;
      }
      
      const data = {
        ...form,
        cover_image: coverUrl,
        status,
        reading_time: estimateReadTime(form.content),
      };

      if (existingStory) {
        if (status === 'published') {
          data.published_at = scheduledDate ? scheduledDate.toISOString() : new Date().toISOString();
        }
        return base44.entities.Story.update(existingStory.id, data);
      } else {
        return base44.entities.Story.create({
          ...data,
          author_id: user.id,
          author_name: user.display_name || user.full_name,
          author_avatar: user.avatar_url,
          published_at: status === 'published' ? (scheduledDate ? scheduledDate.toISOString() : new Date().toISOString()) : undefined,
        });
      }
    },
    onSuccess: (_, [status, scheduledDate]) => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      if (status === 'published' && scheduledDate) {
        toast({ title: `Story scheduled for ${format(scheduledDate, 'MMM d, yyyy')}!` });
      } else if (status === 'published') {
        toast({ title: 'Story published!' });
      } else {
        toast({ title: 'Draft saved!' });
      }
      navigate('/writing-insights');
    },
  });

  const readTime = estimateReadTime(form.content);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              {existingStory ? 'Editing' : 'New Story'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {form.content && (
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mr-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{readTime} min read</span>
                </div>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => createMutation.mutate(['draft'])} disabled={!form.title || createMutation.isPending} className="rounded-lg text-xs">
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Draft'}
            </Button>

            <Popover open={showScheduler} onOpenChange={setShowScheduler}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Select publication date</p>
                    <CalendarComponent
                      mode="single"
                      selected={publishDate}
                      onSelect={setPublishDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border border-border"
                    />
                  </div>
                  {publishDate && (
                    <div className="text-sm text-muted-foreground">
                      Will publish on {format(publishDate, 'MMMM d, yyyy')}
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      createMutation.mutate(['published', publishDate]);
                      setShowScheduler(false);
                    }}
                    disabled={!publishDate || createMutation.isPending || !form.title}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs"
                  >
                    Schedule Story
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button size="sm" onClick={() => createMutation.mutate(['published', null])} disabled={!form.title || createMutation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs">
              {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : existingStory ? 'Update' : 'Publish Now'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
          {/* Cover Image */}
          <label className="block mb-8 group cursor-pointer">
            <div className="aspect-[16/9] rounded-xl overflow-hidden bg-secondary/50 border border-border hover:border-accent/50 transition-colors flex items-center justify-center">
              {coverPreview ? (
                <img src={coverPreview} alt="" className="w-full h-full object-cover group-hover:opacity-95 transition-opacity" />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Add a cover image</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }}} />
          </label>

          {/* Title - Serif, Large, Simple */}
          <input
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            placeholder="Your story title"
            className="w-full text-5xl font-serif font-bold border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/30 mb-3 outline-none"
          />

          {/* Subtitle */}
          <input
            value={form.subtitle}
            onChange={(e) => updateForm('subtitle', e.target.value)}
            placeholder="A brief subtitle (optional)"
            className="w-full text-xl text-muted-foreground border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40 mb-6 outline-none"
          />

          {/* Category Selector - Minimal */}
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
            <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
              <SelectTrigger className="w-auto border-0 bg-transparent px-0 shadow-none gap-2 hover:bg-secondary/50 rounded-lg h-auto py-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingStory && (
              <span className="text-xs text-muted-foreground">
                Updated {format(new Date(existingStory.updated_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {/* Rich Text Editor - Full Width */}
          <div className="min-h-[700px] editor-wrapper">
            <ReactQuill
              value={form.content}
              onChange={(v) => updateForm('content', v)}
              placeholder="Begin writing your story..."
              theme="snow"
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  ['blockquote', 'code-block'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
              className="text-base leading-relaxed font-serif bg-transparent"
            />
          </div>

          {/* Footer hint */}
          {!form.content && (
            <div className="mt-8 text-center text-sm text-muted-foreground/50">
              <p>Tips: Use formatting to emphasize your story. Add links, quotes, and images to make it engaging.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}