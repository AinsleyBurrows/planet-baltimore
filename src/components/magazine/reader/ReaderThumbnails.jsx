import React, { useEffect, useRef } from 'react';

/**
 * The issue laid out as a strip of sheets, the way a publication viewer shows
 * its pages. Each thumbnail jumps to the spread that sheet sits on.
 */
export default function ReaderThumbnails({ entries, activeStep, onJump }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeStep]);

  return (
    <div className="flex items-end gap-2 overflow-x-auto px-4 pb-3 pt-2 scrollbar-hide">
      {entries.map((entry) => {
        const isActive = entry.step === activeStep;
        return (
          <button
            key={entry.key}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => onJump(entry.step)}
            aria-current={isActive ? 'page' : undefined}
            className="shrink-0 text-center"
          >
            <div
              className={`relative h-[74px] w-[54px] overflow-hidden rounded-sm bg-white transition-all ${
                isActive ? 'ring-2 ring-white' : 'opacity-55 ring-1 ring-white/25 hover:opacity-100'
              }`}
            >
              {entry.image ? (
                <img src={entry.image} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-serif text-sm text-neutral-500">
                  {entry.label}
                </span>
              )}
            </div>
            <span
              className={`mt-1 block text-[10px] tabular-nums ${
                isActive ? 'text-white' : 'text-white/45'
              }`}
            >
              {entry.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}