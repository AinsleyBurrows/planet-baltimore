import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Calendar, Lock, Globe, Eye, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const categories = [
  'blog', 'newsletter', 'essay', 'announcement', 'event_recap', 'resource',
  'novel', 'short_story', 'poetry', 'play', 'screenplay', 'memoir',
  'novella', 'flash_fiction', 'spoken_word', 'journal',
];

export default function CreateStory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const storyId = new URLSearchParams(window.location.search).get('id');

  const [user, setUser] = useState(null);
  const [isDraft, setIsDraft] = useState(!storyId);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    cover_image: '',
    category: 'blog',
    tags: [],
    visibility: 'public',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate('/'));
  }, [navigate]);

  const { data: story } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      const results = await base44.entities.Story.filter({ id: storyId });
      return results[0];
    },
    enabled: !!storyId,
  });

  useEffect(() => {
    if (story) {
      setFormData({
        title: story.title || '',
        subtitle: story.subtitle || '',
        content: story.content || '',
        cover_image: story.cover_image || '',
        category: story.category || 'blog',
        tags: story.tags || [],
        visibility: story.visibility || 'public',
      });
      setIsDraft(story.status === 'draft');
    }
  }, [story]);

  const uploadCoverImage = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, cover_image: file_url }));
  };

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (storyId) {
        return base44.entities.Story.update(storyId, data);
      }
      return base44.entities.Story.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-stories'] });
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast({ title: 'Success', description: storyId ? 'Story updated' : 'Story saved' });
      navigate('/stories');
    },
  });

  const handleSave = async (publish = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: 'Error', description: 'Title and content are required', variant: 'destructive' });
      return;
    }

    const wordCount = formData.content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const data = {
      ...formData,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      reading_time: readingTime,
      status: publish ? 'published' : 'draft',
      published_at: publish ? new Date().toISOString() : null,
    };

    createMutation.mutate(data);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, tagInput.trim()])],
      }));
      setTagInput('');
    }
  };

  if (!user) return <div className="flex items-center justify-center py-16">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-accent hover:underline text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={createMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={createMutation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Publish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Cover Image */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-foreground mb-2">Cover Image</label>
        <div className="relative rounded-xl overflow-hidden bg-secondary/50 aspect-video">
          {formData.cover_image ? (
            <>
              <img src={formData.cover_image} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={() => document.getElementById('cover-input').click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-all"
              >
                <ImageIcon className="w-8 h-8 text-white" />
              </button>
            </>
          ) : (
            <button
              onClick={() => document.getElementById('cover-input').click()}
              className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ImageIcon className="w-8 h-8 mb-2" />
              Click to add cover image
            </button>
          )}
        </div>
        <input
          id="cover-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files[0] && uploadCoverImage(e.target.files[0])}
        />
      </div>

      {/* Title & Subtitle */}
      <div className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Story title..."
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full text-3xl font-serif font-bold bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground"
          maxLength={200}
        />
        <textarea
          placeholder="Add a subtitle (optional)..."
          value={formData.subtitle}
          onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
          className="w-full text-lg bg-transparent border-0 outline-none text-muted-foreground placeholder:text-muted-foreground/60 resize-none"
          rows="2"
          maxLength={300}
        />
      </div>

      {/* Metadata */}
      <div className="mb-8 p-4 rounded-lg bg-secondary/30 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.replace('_', ' ').charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Visibility</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              maxLength={30}
            />
            <Button onClick={handleAddTag} variant="outline" size="sm">Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}>
                #{tag} ✕
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="editor-wrapper mb-8">
        <label className="block text-sm font-medium text-foreground mb-2">Content</label>
        <ReactQuill
          value={formData.content}
          onChange={(content) => setFormData(prev => ({ ...prev, content }))}
          theme="snow"
          placeholder="Start writing your story..."
          modules={{
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ list: 'ordered' }, { list: 'bullet' }],
              ['blockquote', 'code-block'],
              ['link', 'image'],
              ['clean'],
            ],
          }}
        />
      </div>
    </div>
  );
}