import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ReaderSheet from './ReaderSheet';

const PAGE_W = 820;
const GAP = 6;

/**
 * The reading stage. The spread is laid out at the magazine's true page measure
 * and scaled to whatever room the screen has, so a two-up spread keeps the
 * proportions of a printed sheet on any viewport.
 */
export default function ReaderSpread({ items, magazine, perView, onPrev, onNext, canPrev, canNext }) {
  const stageRef = useRef(null);
  const rowRef = useRef(null);
  const [fit, setFit] = useState({ scale: 0.7, height: 800 });

  const spreadW = perView * PAGE_W + GAP * (perView - 1);
  const sheetKeys = items.map((item) => item.key).join('-');

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const row = rowRef.current;
    if (!stage || !row) return undefined;

    const compute = () => {
      const availW = Math.max(240, stage.clientWidth - (window.innerWidth >= 640 ? 150 : 40));
      const availH = Math.max(240, stage.clientHeight - 24);
      const designH = row.offsetHeight || 1160;
      const scale = Math.min(availW / spreadW, availH / designH, 1);
      const height = designH * scale;
      setFit((prev) =>
        Math.abs(prev.scale - scale) < 0.001 && Math.abs(prev.height - height) < 1 ? prev : { scale, height }
      );
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(stage);
    observer.observe(row);
    return () => observer.disconnect();
  }, [spreadW, sheetKeys]);

  return (
    <div ref={stageRef} className="relative flex flex-1 items-center justify-center overflow-hidden">
      <div
        key={sheetKeys}
        className="animate-fade-in"
        style={{ width: spreadW * fit.scale, height: fit.height }}
      >
        <div
          ref={rowRef}
          className="flex items-stretch"
          style={{ width: spreadW, gap: GAP, transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}
        >
          {items.map((item) => (
            <div
              key={item.key}
              className="w-[820px] shrink-0 overflow-hidden bg-white shadow-[0_18px_60px_rgba(0,0,0,0.65)] [&>*]:h-full"
            >
              <ReaderSheet item={item} magazine={magazine} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Previous page"
        onClick={onPrev}
        disabled={!canPrev}
        className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/85 disabled:opacity-20 sm:left-5 sm:h-14 sm:w-14"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        aria-label="Next page"
        onClick={onNext}
        disabled={!canNext}
        className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-black/85 disabled:opacity-20 sm:right-5 sm:h-14 sm:w-14"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}