import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Loader2, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import MagazinePageView from '@/components/magazine/MagazinePageView';
import MagazinePager from '@/components/magazine/MagazinePager';

export default function MagazineDetail() {
  const { id } = useParams();
  const [magazine, setMagazine] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [record, me] = await Promise.all([
          base44.entities.Magazine.get(id),
          base44.auth.me().catch(() => null),
        ]);
        if (!active) return;
        setMagazine(record);
        setUser(me);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const total = magazine?.pages?.length || 0;

  useEffect(() => {
    if (!total) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(total - 1, current + 1));
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [total]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (!magazine) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-xl font-bold">Magazine not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This magazine may have been removed.</p>
        <Link to="/magazines">
          <Button className="mt-5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">
            Back to magazines
          </Button>
        </Link>
      </div>
    );
  }

  const page = magazine.pages?.[index];
  const isOwner = !!user && magazine.owner_id === user.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/magazines">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Back to magazines">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl font-bold">{magazine.title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {magazine.issue_label ? `${magazine.issue_label} · ` : ''}
              {total} {total === 1 ? 'page' : 'pages'}
              {magazine.owner_name ? ` · by ${magazine.owner_name}` : ''}
            </p>
          </div>
        </div>
        {isOwner && (
          <Link to={`/magazines/${magazine.id}/edit`}>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg text-xs">
              <Pencil className="h-3.5 w-3.5" /> Edit layout
            </Button>
          </Link>
        )}
      </div>

      {magazine.tagline && (
        <p className="mb-5 max-w-2xl font-serif text-lg italic text-muted-foreground">{magazine.tagline}</p>
      )}

      {page ? (
        <>
          <MagazinePageView
            page={page}
            pageNumber={index + 1}
            totalPages={total}
            magazineTitle={magazine.title}
            issueLabel={magazine.issue_label}
          />
          <MagazinePager index={index} total={total} onChange={setIndex} className="mt-7" />
        </>
      ) : (
        <p className="py-20 text-center text-sm text-muted-foreground">This magazine has no pages yet.</p>
      )}

      {magazine.description && (
        <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">{magazine.description}</p>
      )}
    </div>
  );
}