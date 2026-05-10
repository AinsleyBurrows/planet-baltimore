import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Image, Video, Play } from 'lucide-react';

export default function CommunityMediaGalleryTab({ community }) {
  const [filter, setFilter] = useState('all');
  const [lightbox, setLightbox] = useState(null);

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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['all', 'image', 'video'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
          >
            {f === 'all' ? 'All' : f === 'image' ? '📷 Photos' : '🎬 Videos'}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No media shared yet.</div>
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
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          {lightbox.type === 'video'
            ? <video src={lightbox.url} controls className="max-w-full max-h-full rounded-xl" onClick={e => e.stopPropagation()} />
            : <img src={lightbox.url} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          }
        </div>
      )}
    </div>
  );
}