import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Rss, ImagePlus, VideoIcon, Trash2, Pencil, X, Loader2, Play, Send, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Video Player Modal ───────────────────────────────────────────────────────
function VideoPlayerModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-2xl px-4" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-4 text-white/70 hover:text-white p-2">
          <X className="w-6 h-6" />
        </button>
        <video src={url} controls autoPlay className="w-full rounded-xl max-h-[80vh]" />
      </div>
    </div>
  );
}

// ─── Post Create/Edit Modal ───────────────────────────────────────────────────
function PostModal({ business, user, post, onClose, onSaved }) {
  const [content, setContent] = useState(post?.content || '');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(post?.thumbnail_url || '');
  const [existingMedia, setExistingMedia] = useState(post?.media_urls || []);
  const [mediaType, setMediaType] = useState(post?.media_type || 'text');
  const [saving, setSaving] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  const isVideo = mediaType === 'video' || mediaFiles.some(f => f.type === 'video') || existingMedia.some(u => u.match(/\.(mp4|webm|mov|avi)/i));

  const addFiles = (files, type) => {
    const newFiles = Array.from(files).map(file => ({ file, previewUrl: URL.createObjectURL(file), type }));
    setMediaFiles(prev => [...prev, ...newFiles].slice(0, type === 'video' ? 1 : 4));
    setMediaType(type);
  };

  const handleThumbnail = (e) => {
    const file = e.target.files[0];
    if (file) { setThumbnailFile(file); setThumbnailPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    if (!content.trim() && mediaFiles.length === 0 && existingMedia.length === 0) return;
    setSaving(true);

    let media_urls = [...existingMedia];
    let final_media_type = mediaType;

    if (mediaFiles.length > 0) {
      const uploaded = await Promise.all(mediaFiles.map(m => base44.integrations.Core.UploadFile({ file: m.file })));
      media_urls = [...media_urls, ...uploaded.map(r => r.file_url)];
      final_media_type = mediaFiles[0].type === 'video' ? 'video' : 'image';
    }

    let thumbnail_url = post?.thumbnail_url || '';
    if (thumbnailFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: thumbnailFile });
      thumbnail_url = file_url;
    }

    const postData = {
      content: content.trim(),
      media_urls,
      media_type: media_urls.length > 0 ? final_media_type : 'text',
      thumbnail_url: thumbnail_url || undefined,
      author_id: user.id,
      author_name: business.name,
      author_avatar: business.image_url,
      author_type: 'business',
      page_id: business.id,
      page_type: 'business',
      visibility: 'public',
      post_type: 'announcement',
      neighborhood_id: business.neighborhood_id,
      neighborhood_name: business.neighborhood_name,
    };

    if (post?.id) {
      await base44.entities.Post.update(post.id, postData);
    } else {
      await base44.entities.Post.create(postData);
    }

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{post ? 'Edit Post' : 'New Post'} — {business.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        <textarea
          autoFocus
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`What's new at ${business.name}?`}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />

        {/* Existing media preview */}
        {existingMedia.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {existingMedia.map((url, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-video bg-secondary">
                {url.match(/\.(mp4|webm|mov|avi)/i)
                  ? <video src={url} className="w-full h-full object-cover" muted />
                  : <img src={url} alt="" className="w-full h-full object-cover" />
                }
                <button onClick={() => setExistingMedia(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New files preview */}
        {mediaFiles.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {mediaFiles.map((m, i) => (
              <div key={i} className="relative rounded-xl overflow-hidden aspect-video bg-secondary">
                {m.type === 'video'
                  ? <video src={m.previewUrl} className="w-full h-full object-cover" muted />
                  : <img src={m.previewUrl} alt="" className="w-full h-full object-cover" />
                }
                <button onClick={() => setMediaFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Thumbnail picker for video posts */}
        {isVideo && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Video Thumbnail (optional)</p>
            <label className="block cursor-pointer">
              <div className="h-20 rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
                {thumbnailPreview
                  ? <img src={thumbnailPreview} alt="thumbnail" className="w-full h-full object-cover" />
                  : <span className="text-xs text-muted-foreground">Click to add thumbnail image</span>
                }
              </div>
              <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
            </label>
          </div>
        )}

        {/* Media buttons */}
        <div className="flex gap-2">
          <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent text-muted-foreground hover:text-accent text-xs font-medium transition-colors">
            <ImagePlus className="w-4 h-4" /> Photo
          </button>
          <button onClick={() => videoInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:border-accent text-muted-foreground hover:text-accent text-xs font-medium transition-colors">
            <VideoIcon className="w-4 h-4" /> Video
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files, 'image')} />
          <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={e => addFiles(e.target.files, 'video')} />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || (!content.trim() && mediaFiles.length === 0 && existingMedia.length === 0)}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />{post ? 'Saving…' : 'Posting…'}</> : <><Send className="w-4 h-4" />{post ? 'Save Changes' : 'Post Update'}</>}
        </Button>
      </div>
    </div>
  );
}

// ─── Single Post Card ─────────────────────────────────────────────────────────
function BusinessPostCard({ post, isOwner, currentUserId, onEdit, onDelete }) {
  const [playingVideo, setPlayingVideo] = useState(null);
  const isVideo = post.media_type === 'video' || post.media_urls?.[0]?.match(/\.(mp4|webm|mov|avi)/i);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {post.media_urls?.length > 0 && (
        <div className="relative">
          {isVideo ? (
            <div className="relative aspect-video bg-black cursor-pointer" onClick={() => setPlayingVideo(post.media_urls[0])}>
              {post.thumbnail_url
                ? <img src={post.thumbnail_url} alt="thumbnail" className="w-full h-full object-cover" />
                : <video src={post.media_urls[0]} className="w-full h-full object-cover" muted preload="metadata" />
              }
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <div className={`grid gap-1 ${post.media_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.media_urls.slice(0, 4).map((url, i) => (
                <img key={i} src={url} alt="" className="w-full aspect-video object-cover" />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {post.content && <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-muted-foreground">{new Date(post.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(post)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { if (window.confirm('Delete this post?')) onDelete(post.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {playingVideo && <VideoPlayerModal url={playingVideo} onClose={() => setPlayingVideo(null)} />}
    </div>
  );
}

// ─── Main BusinessPostsFeed ───────────────────────────────────────────────────
export default function BusinessPostsFeed({ business, isOwner, user }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const { data: posts = [] } = useQuery({
    queryKey: ['business-posts', business.id],
    queryFn: () => base44.entities.Post.filter({ page_id: business.id, page_type: 'business' }, '-created_date', 20),
    staleTime: 30000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business-posts', business.id] });
    setShowModal(false);
    setEditingPost(null);
  };

  const handleDelete = async (postId) => {
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ['business-posts', business.id] });
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowModal(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Rss className="w-4 h-4 text-accent" /> Posts & Updates
        </h2>
        {isOwner && (
          <button onClick={() => { setEditingPost(null); setShowModal(true); }} className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
            <Plus className="w-3.5 h-3.5" /> Add Post
          </button>
        )}
      </div>

      {isOwner && posts.length === 0 && (
        <button
          onClick={() => { setEditingPost(null); setShowModal(true); }}
          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <Plus className="w-4 h-4" /> Share an update with your followers
        </button>
      )}

      {posts.length === 0 && !isOwner ? (
        <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <BusinessPostCard
              key={post.id}
              post={post}
              isOwner={isOwner}
              currentUserId={user?.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && user && (
        <PostModal
          business={business}
          user={user}
          post={editingPost}
          onClose={() => { setShowModal(false); setEditingPost(null); }}
          onSaved={refresh}
        />
      )}
    </div>
  );
}