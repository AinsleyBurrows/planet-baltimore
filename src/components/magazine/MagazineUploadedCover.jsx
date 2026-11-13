import React from 'react';

/* A cover made elsewhere, shown at its own proportions across the width of the
   sheet so nothing the designer set is cropped. */
export default function MagazineUploadedCover({ url, title }) {
  return (
    <div className="mx-auto w-full max-w-[820px] overflow-hidden border border-border/70 bg-white shadow-[0_18px_50px_-18px_rgba(0,0,0,0.4)]">
      <img src={url} alt={`${title || 'Magazine'} cover`} className="block h-auto w-full" />
    </div>
  );
}