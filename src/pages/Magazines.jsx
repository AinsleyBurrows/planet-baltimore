import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import MagazineCard from '@/components/magazine/MagazineCard';

export default function Magazines() {
  const [magazines, setMagazines] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [me, result] = await Promise.all([
          base44.auth.me().catch(() => null),
          base44.entities.Magazine.list({ sort: '-created_date', limit: 60 }),
        ]);
        if (!active) return;
        setUser(me);
        setMagazines(result?.items || result || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /* Unfinished issues stay with the person writing them: drafts show up only for
     their owner (and for admins), and everything else is the public shelf. */
  const drafts = magazines.filter(
    (magazine) => magazine.status === 'draft' && (magazine.owner_id === user?.id || user?.role === 'admin'),
  );
  const published = magazines.filter((magazine) => magazine.status !== 'draft');

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Magazines</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Reader-made magazines from around Baltimore. Lay out your own pages with words and photos — anyone can
            start one.
          </p>
        </div>
        <Link to="/magazines/new">
          <Button className="gap-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="h-4 w-4" /> Create magazine
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-accent" />
        </div>
      ) : drafts.length === 0 && published.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-serif text-xl font-semibold">No magazines yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Start the first issue and build it page by page.</p>
          <Link to="/magazines/new">
            <Button className="mt-5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90">
              Create magazine
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {drafts.length > 0 && (
            <section className="mt-8">
              <h2 className="font-serif text-xl font-bold">Your drafts</h2>
              <p className="text-xs text-muted-foreground">
                Saved work in progress — only you can open these until you publish them.
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {drafts.map((magazine) => (
                  <MagazineCard key={magazine.id} magazine={magazine} />
                ))}
              </div>
            </section>
          )}

          {published.length > 0 && (
            <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${drafts.length ? 'mt-8' : 'mt-6'}`}>
              {published.map((magazine) => (
                <MagazineCard key={magazine.id} magazine={magazine} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}