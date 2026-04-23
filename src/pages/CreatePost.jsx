import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Video, Type, Music, X, ArrowLeft, MapPin, Tag, Calendar, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const postTypes = [
  { id: 'image', label: 'Photo', icon: Image },
  { id: 'video', label: 'Video', icon: Video },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'audio', label: 'Music', icon: Music },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeType, setActiveType] = useState('text');
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const previews = files.map(f => URL.createObjectURL(f));
    setMediaPreviews(prev => [...prev, ...previews]);
    setMediaFiles(prev => [...prev, ...files]);
  };

  const removeMedia = (index) => {
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    const tag = tagInput.trim().replace('#', '');
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      setIsUploading(true);
      let mediaUrls = [];
      
      for (const file of mediaFiles) {
        const result = await base44.integrations.Core.UploadFile({ file });
        mediaUrls.push(result.file_url);
      }

      return base44.entities.Post.create({
        author_id: user.id,
        author_name: user.display_name || user.full_name,
        author_avatar: user.avatar_url,
        content,
        media_urls: mediaUrls,
        media_type: mediaUrls.length > 0 ? activeType : 'text',
        tags,
        visibility: 'public',
        post_type: 'standard',
        neighborhood_name: user.neighborhood_names?.[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      toast({ title: 'Post published!' });
      navigate('/');
    },
    onError: () => {
      setIsUploading(false);
      toast({ title: 'Failed to publish', variant: 'destructive' });
    },
  });

  const canPublish = content.trim() || mediaFiles.length > 0;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">Create Post</h1>
        <Button onClick={() => createMutation.mutate()} disabled={!canPublish || createMutation.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg px-5">
          {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
        </Button>
      </div>

      {/* Post Type Selector */}
      <div className="flex gap-2 mb-5">
        {postTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button key={type.id} onClick={() => setActiveType(type.id)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeType === type.id ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}>
              <Icon className="w-4 h-4" />{type.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's happening in Baltimore?" className="min-h-[120px] text-base border-0 bg-transparent resize-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60" />

      {/* Media Preview */}
      {mediaPreviews.length > 0 && (
        <div className={`grid gap-2 mt-4 rounded-xl overflow-hidden ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {mediaPreviews.map((preview, idx) => (
            <div key={idx} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removeMedia(idx)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media Upload */}
      {(activeType === 'image' || activeType === 'video' || activeType === 'audio') && (
        <div className="mt-4">
          <label className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer bg-secondary/30">
            <input type="file" multiple accept={activeType === 'image' ? 'image/*' : activeType === 'video' ? 'video/*' : 'audio/*'} className="hidden" onChange={handleMediaUpload} />
            <div className="text-center">
              <Image className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
              <span className="text-sm text-muted-foreground">Add {activeType === 'image' ? 'photos' : activeType === 'video' ? 'videos' : 'audio'}</span>
            </div>
          </label>
        </div>
      )}

      {/* Tags */}
      <div className="mt-5 pt-5 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tags..." className="border-0 bg-transparent h-8 px-0 focus-visible:ring-0" />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs gap-1">
                #{tag}
                <button onClick={() => setTags(tags.filter((_, i) => i !== idx))}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}