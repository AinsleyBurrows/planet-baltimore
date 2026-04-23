import React, { useState } from 'react';
import ImageLightbox from './ImageLightbox';

export default function AppImage({ src, alt = '', className = '', clickable = true, images, index = 0, aspectRatio = 'auto' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const aspectClasses = {
    'square': 'aspect-square',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    'auto': '',
  };

  if (imgError || !src) {
    return (
      <div className={`bg-muted flex items-center justify-center ${aspectClasses[aspectRatio] || ''} ${className}`}>
        <span className="text-muted-foreground text-xs">No image</span>
      </div>
    );
  }

  const allImages = images || [src];

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`object-cover ${clickable ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''} ${aspectClasses[aspectRatio] || ''} ${className}`}
        onClick={clickable ? () => setLightboxOpen(true) : undefined}
        onError={() => setImgError(true)}
        loading="lazy"
      />
      {clickable && (
        <ImageLightbox images={allImages} initialIndex={index} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}