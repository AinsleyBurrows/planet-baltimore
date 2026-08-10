import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, ChevronLeft, ChevronRight, X, Play, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const isVideoUrl = (u = '') => /\.(mp4|webm|mov|avi)/i.test(u);

function tileMedia(post) {
  if (post.media_urls?.length > 0) {
    const first = post.media_urls[0];
    if (post.media_type === 'audio') return { kind: 'audio', thumb: post.thumbnail_url };
    if (post.media_type === 'video' || isVideoUrl(first)) return { kind: 'video', thumb: post.thumbnail_url || first };
    return { kind: 'image', url: first };
  }
  if (post.bg_color && post.content) return { kind: 'color', color: post.bg_color, text: post.content };
  return { kind: 'text', text: post.content };
}

function Tile({ post, onOpen }) {
  const m = tileMedia(post);
  return (
    <button
      onClick={() => onOpen(post)}
      className="group relative aspect-square w-full overflow-hidden rounded-lg bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {m.kind === 'image' && (
        <img src={m.url} alt={post.content || ''} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      )}
      {m.kind === 'video' && (
        <>
          {m.thumb ? (
            <img src={m.thumb} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-11 h-11 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/40">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </>
      )}
      {m.kind === 'audio' && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
          <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center">
            <Play className="w-5 h-5 text-accent ml-0.5" />
          </div>
          {post.content && <p className="text-[11px] text-muted-foreground line-clamp-3 text-center">{post.content}</p>}
        </div>
      )}
      {m.kind === 'color' && (
        <div className="w-full h-full flex items-center justify-center p-4" style={{ backgroundColor: m.color }}>
          <p className="font-serif text-sm leading-snug text-center line-clamp-4" style={{ color: '#fff' }}>{m.text}</p>
        </div>
      )}
      {m.kind === 'text' && (
        <div className="w-full h-full flex items-center justify-center p-4 bg-secondary">
          <p className="text-xs text-muted-foreground line-clamp-6 text-center whitespace-pre-wrap">{m.text}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
    </button>
  );
}

function Viewer({ posts, index, onClose, onIndex }) {
  const post = posts[index];
  const m = tileMedia(post);
  const go = useCallback((dir) => {
    onIndex((index + dir + posts.length) % posts.length);
  }, [index, posts.length, onIndex]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div className="relative flex flex-col sm:flex-row max-w-5xl w-full max-h-full bg-card rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Image / media side */}
        <div className="relative flex-1 flex items-center justify-center min-h-0 bg-black min-h-[40vh] sm:min-h-0">
          {m.kind === 'image' && (
            <img src={m.url} alt={post.content || ''} className="max-w-full max-h-full object-contain" />
          )}
          {m.kind === 'video' && (
            <video src={post.media_urls[0]} poster={m.thumb || undefined} controls className="max-w-full max-h-full" />
          )}
          {m.kind === 'audio' && (
            <div className="w-full max-w-md flex flex-col gap-4 p-4">
              {m.thumb && <img src={m.thumb} alt="" className="w-full aspect-video object-cover rounded-lg" />}
              <audio src={post.media_urls[0]} controls className="w-full" />
            </div>
          )}
          {m.kind === 'color' && (
            <div className="w-full max-w-md aspect-video flex items-center justify-center p-8" style={{ backgroundColor: m.color }}>
              <p className="font-serif text-xl leading-snug text-center" style={{ color: '#fff' }}>{m.text}</p>
            </div>
          )}
          {m.kind === 'text' && (
            <div className="w-full max-w-md p-8">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          )}

        </div>

        {/* Info side panel */}
        <aside className="sm:w-80 lg:w-96 overflow-y-auto max-h-[40vh] sm:max-h-full">
          <div className="p-5 sm:p-6">
            <Link to={`/profile/${post.author_id}`} className="flex items-center gap-3 mb-4 group">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback className="bg-accent/10 text-accent font-semibold text-sm">{post.author_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">{post.author_name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">{post.created_date ? format(new Date(post.created_date), 'MMM d, yyyy') : ''}</p>
              </div>
            </Link>

            {post.content && (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-4">{post.content}</p>
            )}

            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {post.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs font-normal">#{tag}</Badge>)}
              </div>
            )}

            <div className="flex items-center gap-5 text-muted-foreground text-sm pt-3 border-t border-border">
              <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {post.likes_count || 0}</span>
              <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" /> {post.comments_count || 0}</span>
            </div>

            {posts.length > 1 && (
              <p className="mt-4 text-xs text-muted-foreground text-center">{index + 1} / {posts.length}</p>
            )}
          </div>
        </aside>
      </div>

      {posts.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm z-10"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm z-10"><ChevronRight className="w-6 h-6" /></button>
        </>
      )}
      <button onClick={onClose} className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm z-10"><X className="w-5 h-5" /></button>
    </div>
  );
}

export default function PostsImageGrid({ posts }) {
  const [openIndex, setOpenIndex] = useState(null);
  if (!posts?.length) return null;
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {posts.map(p => <Tile key={p.id} post={p} onOpen={(post) => setOpenIndex(posts.findIndex(x => x.id === post.id))} />)}
      </div>
      {openIndex !== null && openIndex >= 0 && (
        <Viewer posts={posts} index={openIndex} onClose={() => setOpenIndex(null)} onIndex={setOpenIndex} />
      )}
    </>
  );
}