import React, { useEffect, useState } from 'react';
import { festivals as curatedFestivals } from '@/data/festivals';
import { base44 } from '@/api/base44Client';
import { dbFestivalToShape } from '@/lib/festivalShape';
import { useSavedFestivals } from '@/components/festivals/SaveButton';
import FestivalCard from '@/components/festivals/FestivalCard';

export default function SavedFestivals() {
  const { saved } = useSavedFestivals();
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
  [...curatedFestivals, ...dbFestivals].forEach((f) => { if (f?.slug) bySlug[f.slug] = f; });
  const savedFestivals = saved.map((s) => bySlug[s]).filter(Boolean);

  if (savedFestivals.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Festivals</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedFestivals.map((f) => <FestivalCard key={f.slug} festival={f} />)}
      </div>
    </div>
  );
}