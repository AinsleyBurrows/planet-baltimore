import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReaderTopBar from '@/components/magazine/reader/ReaderTopBar';
import ReaderSpread from '@/components/magazine/reader/ReaderSpread';
import ReaderThumbnails from '@/components/magazine/reader/ReaderThumbnails';

const firstImage = (page) => page?.blocks?.find((block) => block.type === 'image' && block.url)?.url || '';

export default function MagazineReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [perView, setPerView] = useState(() => (window.innerWidth >= 1024 ? 2 : 1));
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const record = await base44.entities.Magazine.get(id);
        if (active) setMagazine(record);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const onResize = () => setPerView(window.innerWidth >= 1024 ? 2 : 1);
    const onFullscreen = () => setFullscreen(!!document.fullscreenElement);
    window.addEventListener('resize', onResize);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, []);

  useEffect(() => setStep(0), [perView]);

  const total = magazine?.pages?.length || 0;
  const hasCover = !!magazine?.cover?.blocks?.length || !!magazine?.cover_image_url;

  const steps = useMemo(() => {
    const list = [];
    if (hasCover) list.push({ kind: 'cover' });
    for (let index = 0; index < total; index += perView) list.push({ kind: 'pages', from: index });
    return list;
  }, [hasCover, total, perView]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') setStep((current) => Math.min(steps.length - 1, current + 1));
      if (event.key === 'ArrowLeft') setStep((current) => Math.max(0, current - 1));
      if (event.key === 'Escape' && !document.fullscreenElement) navigate(`/magazines/${id}`);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [steps.length, id, navigate]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950">
        <Loader2 className="h-7 w-7 animate-spin text-white/60" />
      </div>
    );
  }

  if (!magazine || !steps.length) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-neutral-950 px-6 text-center">
        <p className="font-serif text-xl text-white">
          {magazine ? 'This issue has no pages yet.' : 'Magazine not found'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/magazines')}
          className="rounded-full bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/20"
        >
          Back to magazines
        </button>
      </div>
    );
  }

  const current = steps[Math.min(step, steps.length - 1)];
  const items =
    current.kind === 'cover'
      ? [{ key: 'cover', cover: true }]
      : Array.from({ length: Math.min(perView, total - current.from) }, (_, offset) => ({
          key: `p${current.from + offset}`,
          page: magazine.pages[current.from + offset],
          number: current.from + offset + 1,
        }));

  const lastNumber = current.kind === 'cover' ? 0 : current.from + items.length;
  const label =
    current.kind === 'cover'
      ? 'Cover'
      : items.length > 1
        ? `Pages ${current.from + 1}–${lastNumber} of ${total}`
        : `Page ${current.from + 1} of ${total}`;

  const entries = [];
  if (hasCover) {
    entries.push({
      key: 'cover',
      label: 'Cover',
      step: 0,
      image: magazine.cover_image_url || firstImage(magazine.cover),
    });
  }
  magazine.pages?.forEach((page, index) => {
    entries.push({
      key: `p${index}`,
      label: String(index + 1),
      step: hasCover ? 1 + Math.floor(index / perView) : Math.floor(index / perView),
      image: firstImage(page),
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
      <ReaderTopBar
        magazine={magazine}
        label={label}
        backTo={() => navigate(`/magazines/${id}`)}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      <ReaderSpread
        items={items}
        magazine={magazine}
        perView={perView}
        canPrev={step > 0}
        canNext={step < steps.length - 1}
        onPrev={() => setStep((value) => Math.max(0, value - 1))}
        onNext={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
      />

      <div className="border-t border-white/10 bg-black/40">
        <ReaderThumbnails entries={entries} activeStep={step} onJump={setStep} />
      </div>
    </div>
  );
}