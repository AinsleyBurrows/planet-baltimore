import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Video, Type, Music, X, ArrowLeft, Tag, Loader2, Camera, RefreshCw, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import TextBgPicker, { getTextColor } from '@/components/shared/TextBgPicker';

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
  const [bgColor, setBgColor] = useState('#1a1a2e');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [videoVisibility, setVideoVisibility] = useState('public');
  const videoRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const previews = files.map(f => URL.createObjectURL(f));
    setMediaPreviews(prev => [...prev, ...previews]);
    setMediaFiles(prev => [...prev, ...files]);

    // Auto-generate thumbnail from first video or audio file
    if (activeType === 'video' && files[0]) {
      generateVideoThumbnail(files[0]);
    } else if (activeType === 'audio') {
      generateAudioThumbnail();
    }
  };

  const generateVideoThumbnail = (videoFile) => {
   const video = document.createElement('video');
   video.src = URL.createObjectURL(videoFile);
   video.currentTime = 1;
   video.onloadeddata = () => {
     const canvas = document.createElement('canvas');
     canvas.width = video.videoWidth;
     canvas.height = video.videoHeight;
     canvas.getContext('2d').drawImage(video, 0, 0);
     canvas.toBlob((blob) => {
       const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
       setThumbnailFile(file);
       setThumbnailPreview(canvas.toDataURL('image/jpeg'));
     }, 'image/jpeg', 0.85);
   };
  };

  const generateAudioThumbnail = () => {
   const canvas = document.createElement('canvas');
   canvas.width = 300;
   canvas.height = 300;
   const ctx = canvas.getContext('2d');

   // Gradient background (music theme)
   const gradient = ctx.createLinearGradient(0, 0, 300, 300);
   gradient.addColorStop(0, '#6366f1');
   gradient.addColorStop(1, '#8b5cf6');
   ctx.fillStyle = gradient;
   ctx.fillRect(0, 0, 300, 300);

   // Music notes
   ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
   ctx.font = 'bold 80px Arial';
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';
   ctx.fillText('♪', 150, 150);

   canvas.toBlob((blob) => {
     const file = new File([blob], 'audio-thumbnail.jpg', { type: 'image/jpeg' });
     setThumbnailFile(file);
     setThumbnailPreview(canvas.toDataURL('image/jpeg'));
   }, 'image/jpeg', 0.85);
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
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

      let thumbnailUrl;
      if ((activeType === 'video' || activeType === 'audio') && thumbnailFile) {
        const thumbResult = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
        thumbnailUrl = thumbResult.file_url;
      }

      return base44.entities.Post.create({
        author_id: user.id,
        author_name: user.display_name || user.full_name,
        author_avatar: user.avatar_url,
        author_type: 'user',
        page_type: 'personal',
        content,
        media_urls: mediaUrls,
        media_type: mediaUrls.length > 0 ? activeType : 'text',
        tags,
        bg_color: activeType === 'text' && mediaUrls.length === 0 ? bgColor : undefined,
        thumbnail_url: thumbnailUrl,
        visibility: activeType === 'video' ? videoVisibility : 'public',
        post_type: 'standard',
        neighborhood_name: user.neighborhood_names?.[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['home-posts'] });

      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      navigate(from === 'profile' ? '/profile' : '/');
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
            <button key={type.id} onClick={() => setActiveType(type.id)} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeType === type.id ? 'border text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`} style={activeType === type.id ? { backgroundColor: '#d4580a', borderColor: '#d4580a' } : {}}>
              <Icon className="w-4 h-4" />{type.label}
            </button>
          );
        })}
      </div>

      {/* Content Area — text posts get live bg preview */}
      {activeType === 'text' ? (
        <div className="space-y-4">
          <div
            className="rounded-xl p-6 min-h-[160px] flex items-center justify-center transition-colors"
            style={{ backgroundColor: bgColor }}
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Say something meaningful..."
              className="w-full bg-transparent border-none resize-none focus:outline-none text-center text-xl font-serif leading-relaxed placeholder:opacity-50"
              style={{ color: getTextColor(bgColor) }}
              rows={4}
            />
          </div>
          <TextBgPicker value={bgColor} onChange={setBgColor} />
        </div>
      ) : (
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's happening in Baltimore?" className="min-h-[120px] text-base border-0 bg-transparent resize-none focus-visible:ring-0 p-0 placeholder:text-muted-foreground/60" />
      )}

      {/* Media Preview */}
      {mediaPreviews.length > 0 && (
        <div className={`grid gap-2 mt-4 rounded-xl overflow-hidden ${mediaPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {mediaPreviews.map((preview, idx) => (
            <div key={idx} className="relative bg-muted rounded-lg overflow-hidden">
              {activeType === 'audio' ? (
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Music className="w-5 h-5 text-accent flex-shrink-0" />
                    <span className="truncate">{mediaFiles[idx]?.name}</span>
                  </div>
                  <audio src={preview} controls className="w-full h-10" />
                </div>
              ) : activeType === 'video' ? (
                <div className="aspect-square">
                  <video src={preview} className="w-full h-full object-cover" muted preload="metadata" />
                </div>
              ) : (
                <div className="aspect-square">
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <button onClick={() => removeMedia(idx)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video/Audio Thumbnail Picker */}
      {(activeType === 'video' || activeType === 'audio') && mediaPreviews.length > 0 && (
        <div className="mt-4 p-4 bg-secondary/40 rounded-xl space-y-2">
          <p className="text-sm font-medium text-foreground">Thumbnail</p>
          <div className="flex items-center gap-3">
            <div className="w-20 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-foreground cursor-pointer hover:bg-secondary transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                <Camera className="w-3.5 h-3.5" />Upload
              </label>
              <button
                onClick={() => activeType === 'video' ? generateVideoThumbnail(mediaFiles[0]) : generateAudioThumbnail()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />Auto
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Upload a custom thumbnail or auto-generate</p>
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

      {/* Video Visibility */}
      {activeType === 'video' && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm font-medium text-foreground mb-2">Who can see this video?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setVideoVisibility('public')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${videoVisibility === 'public' ? 'bg-accent text-white border-accent' : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'}`}
            >
              <Globe className="w-4 h-4" /> Everyone
            </button>
            <button
              onClick={() => setVideoVisibility('followers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${videoVisibility === 'followers' ? 'bg-accent text-white border-accent' : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'}`}
            >
              <Users className="w-4 h-4" /> Followers only
            </button>
          </div>
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