import React, { useRef, useEffect, useState } from 'react';
import { Play } from 'lucide-react';

// Curated bg colors for text posts
const TEXT_COLOR_MAP = {
  '#1a1a2e': '#ffffff', '#16213e': '#ffffff', '#0f3460': '#ffffff',
  '#1b4332': '#ffffff', '#2d3a4a': '#ffffff', '#3d2b1f': '#ffffff',
  '#4a1942': '#ffffff', '#2c2c54': '#ffffff', '#1a1a1a': '#ffffff',
  '#f5f0e8': '#1a1a1a', '#fef9ef': '#1a1a1a', '#f0f4f8': '#1a1a1a',
  '#e8f4f8': '#1a1a1a', '#fdf6ec': '#1a1a1a',
  '#c9a96e': '#1a1a1a', '#d4a853': '#1a1a1a',
};

function VideoThumb({ src, thumbnail }) {
  const videoRef = useRef(null);
  const [thumb, setThumb] = useState(thumbnail || null);

  useEffect(() => {
    if (thumb || !src) return;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = src;
    video.currentTime = 1;
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      setThumb(canvas.toDataURL('image/jpeg'));
    };
  }, [src, thumb]);

  return (
    <div className="relative w-full h-full bg-white flex items-center justify-center">
      {thumb ? (
        <img src={thumb} alt="video thumbnail" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
          <Play className="w-5 h-5 text-white fill-white ml-0.5" />
        </div>
      </div>
    </div>
  );
}

export default function PostGridTile({ post, onClick }) {
  const images = post?.media_urls || [];
  const isVideo = post?.media_type === 'video' || images[0]?.match(/\.(mp4|webm|mov|avi)/i);
  const isText = images.length === 0 || post?.media_type === 'text';
  const hasBg = !!post?.bg_color;

  const textColor = hasBg ? (TEXT_COLOR_MAP[post.bg_color] || '#ffffff') : '#ffffff';

  return (
    <button
      onClick={() => onClick?.(post)}
      className="aspect-square w-full overflow-hidden relative group focus:outline-none bg-white"
    >
      {isVideo ? (
        <VideoThumb src={images[0]} thumbnail={post.thumbnail_url} />
      ) : isText ? (
        <div
          className="w-full h-full flex items-center justify-center p-4 text-center"
          style={{ backgroundColor: post.bg_color || '#1a1a2e' }}
        >
          <p
            className="font-serif text-sm leading-snug font-medium line-clamp-4"
            style={{ color: textColor }}
          >
            {post.content}
          </p>
        </div>
      ) : (
        <img
          src={images[0]}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Multi-image indicator */}
      {images.length > 1 && !isVideo && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-5 h-5 bg-black/50 rounded-sm flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              {[0,1,2,3].map(i => <div key={i} className="w-1 h-1 bg-white rounded-[1px]" />)}
            </div>
          </div>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3 text-white text-sm font-medium">
          <span>❤️ {post.likes_count || 0}</span>
          <span>💬 {post.comments_count || 0}</span>
        </div>
      </div>
    </button>
  );
}