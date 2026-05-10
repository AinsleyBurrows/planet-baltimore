import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Play, Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CommunityMediaGalleryTab({ community }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts', community.id],
    queryFn: () => base44.entities.Post.filter({ community_id: community.id }, '-created_date', 100),
    enabled: !!community.id,
  });

  const media = posts.flatMap(p =>
    (p.media_urls || []).map(url => ({
      url,
      type: p.media_type === 'video' || /\.(mp4|webm|mov)/i.test(url) ? 'video' : 'image',
      author: p.author_name,
      post_id: p.id,
    }))
  );

  const filtered = filter === 'all' ? media : media.filter(m => m.type === filter);

  const handleFilesSelected = (files) => {
    const arr = Array.from(files);
    setSelectedFiles(arr);
    setPreviews(arr.map(f => ({ url: URL.createObjectURL(f), type: f.type.startsWith('video') ? 'video' : 'image' })));
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!user || selectedFiles.length === 0) return;
    setUploading(true);
    const uploadedUrls = await Promise.all(selectedFiles.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    const isVideo = selectedFiles[0].type.startsWith('video');
    await base44.entities.Post.create({
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      content: caption || '',
      media_urls: uploadedUrls,
      media_type: isVideo ? 'video' : 'image',
      community_id: community.id,
      neighborhood_id: community.neighborhood_id,
      neighborhood_name: community.neighborhood_name,
      visibility: 'community',
    });
    queryClient.invalidateQueries({ queryKey: ['community-posts', community.id] });
    setUploading(false);
    setShowUpload(false);
    setSelectedFiles([]);
    setPreviews([]);
    setCaption('');
  };

  const cancelUpload = () => {
    setShowUpload(false);
    setSelectedFiles([]);
    setPreviews([]);
    setCaption('');
  };

  return (
    <div className="space-y-4">
      {/* Upload button for members */}
      {user && (
        <div>
          {!showUpload ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-foreground text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              <ImagePlus className="w-4 h-4" /> Share a Photo or Video
            </button>
          ) : (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              {/* Previews */}
              <div className="flex flex-wrap gap-2">
                {previews.map((p, i) => (
                  <div key={i} className="w-20 h-20 rounded-lg overflow-hidden bg-secondary relative">
                    {p.type === 'video'
                      ? <video src={p.url} className="w-full h-full object-cover" muted />
                      : <img src={p.url} alt="" className="w-full h-full object-cover" />
                    }
                  </div>
                ))}
              </div>
              <input
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                placeholder="Add a caption (optional)"
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleUpload} disabled={uploading} className="bg-foreground hover:bg-foreground/90 text-background gap-1.5">
                  {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Uploading…</> : <><Upload className="w-3.5 h-3.5" />Post</>}
                </Button>
                <Button size="sm" variant="outline" onClick={cancelUpload} disabled={uploading}>Cancel</Button>
              </div>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={e => e.target.files?.length && handleFilesSelected(e.target.files)} />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'image', 'video'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {f === 'all' ? 'All' : f === 'image' ? 'Photos' : 'Videos'}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No media shared yet. Be the first!</div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {filtered.map((m, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-secondary relative cursor-pointer group" onClick={() => setLightbox(m)}>
              {m.type === 'video' ? (
                <>
                  <video src={m.url} className="w-full h-full object-cover" muted preload="metadata" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </>
              ) : (
                <img src={m.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
              )}
              {m.author && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[10px] truncate">{m.author}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20" onClick={() => setLightbox(null)}>
            <X className="w-5 h-5" />
          </button>
          {lightbox.type === 'video'
            ? <video src={lightbox.url} controls autoPlay className="max-w-full max-h-full rounded-xl" onClick={e => e.stopPropagation()} />
            : <img src={lightbox.url} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          }
        </div>
      )}
    </div>
  );
}