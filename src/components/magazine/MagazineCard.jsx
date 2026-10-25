import React from 'react';
import { Link } from 'react-router-dom';

export default function MagazineCard({ magazine }) {
  const pageCount = magazine.pages?.length || 0;

  return (
    <Link
      to={`/magazines/${magazine.id}`}
      className="interactive-card block overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
        {magazine.cover_image_url ? (
          <img
            src={magazine.cover_image_url}
            alt={magazine.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy to-navy/80 px-5 text-center">
            <span className="font-serif text-xl font-bold leading-tight text-white break-words">{magazine.title}</span>
            {magazine.issue_label && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">{magazine.issue_label}</span>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {magazine.issue_label && <span>{magazine.issue_label}</span>}
          <span>·</span>
          <span>
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
        </div>
        <h3 className="font-serif text-lg font-bold leading-snug text-foreground break-words">{magazine.title}</h3>
        {magazine.tagline && (
          <p className="mt-1 text-sm leading-snug text-muted-foreground break-words">{magazine.tagline}</p>
        )}
        {magazine.owner_name && <p className="mt-3 text-xs text-muted-foreground">by {magazine.owner_name}</p>}
      </div>
    </Link>
  );
}