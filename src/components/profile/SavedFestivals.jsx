import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { festivals as curatedFestivals } from '@/data/festivals';
import { base44 } from '@/api/base44Client';
import { dbFestivalToShape } from '@/lib/festivalShape';
import { useSavedFestivals, useSavedFestivalIds } from '@/components/festivals/SaveButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import SaveButton from '@/components/festivals/SaveButton';

function dateRange(f) {
  const opts = { month: 'short', day: 'numeric' };
  const s = f.startDate ? new Date(f.startDate).toLocaleDateString('en-US', opts) : '';
  if (!s) return '';
  if (!f.endDate || f.endDate === f.startDate) return s;
  return `${s} – ${new Date(f.endDate).toLocaleDateString('en-US', opts)}`;
}

function SavedFestivalPoster({ f }) {
  const meta = [dateRange(f), f.neighborhood].filter(Boolean).join(' · ');
  const isFree = f.admission?.type === 'free';
  const priceLabel = isFree ? 'Free' : (f.admission?.price || 'Ticketed');

  return (
    <Link
      to={`/festivals/${f.slug}`}
      className="relative rounded-xl overflow-hidden border border-border bg-card aspect-[4/3] sm:aspect-square group text-left w-full interactive-card hover:border-[#d4580a]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {f.image ? (
        <img src={f.image} alt={f.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-accent/10 text-accent font-black text-6xl">{f.name?.charAt(0) || '?'}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute top-2 right-2 z-10">
        <SaveButton slug={f.slug} festivalId={f.id} festivalName={f.name} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
        <p className="font-bold text-xl leading-tight drop-shadow">{f.name}</p>
        {meta && <p className="text-xs text-white/85 mt-0.5">{meta}</p>}
        {f.description && <p className="text-xs text-white/75 mt-1 line-clamp-2">{f.description}</p>}
        <span
          className="inline-flex items-center mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg text-white"
          style={{ backgroundColor: isFree ? '#16a34a' : '#d4580a' }}
        >
          {priceLabel}
        </span>
      </div>
    </Link>
  );
}

export default function SavedFestivals() {
  const { user } = useCurrentUser();
  const { saved } = useSavedFestivals();
  const savedIds = useSavedFestivalIds(user?.id);
  const [dbFestivals, setDbFestivals] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const records = await base44.entities.Festival.filter({ status: 'published' }, '-created_date', 100);
        if (!cancelled) setDbFestivals(records.map(dbFestivalToShape).filter(Boolean));
      } catch { /* curated festivals still resolve */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const bySlug = {};
  const byId = {};
  [...curatedFestivals, ...dbFestivals].forEach((f) => {
    if (f?.slug) bySlug[f.slug] = f;
    if (f?.id) byId[f.id] = f;
  });

  const savedBySlug = saved.map((s) => bySlug[s]).filter(Boolean);
  const savedById = savedIds.map((id) => byId[id]).filter(Boolean);
  const savedFestivals = [...savedBySlug, ...savedById].filter(
    (f, i, arr) => arr.findIndex((x) => (x.id || x.slug) === (f.id || f.slug)) === i
  );

  if (savedFestivals.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Festivals</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {savedFestivals.map((f) => <SavedFestivalPoster key={f.id || f.slug} f={f} />)}
      </div>
    </div>
  );
}