import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Navigates a magazine. When `cover` is set, the designed cover sits in front of
 * page 1, so Back from the first page and Next from the cover walk onto it.
 */
export default function MagazinePager({
  index,
  total,
  onChange,
  cover = false,
  coverActive = false,
  onSelectCover,
  className = '',
}) {
  if (!total) return null;
  const atCover = cover && coverActive;
  const canPrev = !atCover && (index > 0 || cover);
  const canNext = atCover || index < total - 1;

  const goPrev = () => {
    if (atCover) return;
    if (index === 0 && cover) {
      onSelectCover?.();
      return;
    }
    onChange(index - 1);
  };

  const goNext = () => {
    if (atCover) {
      onChange(0);
      return;
    }
    onChange(index + 1);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={!canPrev}
          className="h-10 gap-1.5 rounded-full px-4 text-xs font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex max-w-[45%] flex-wrap items-center justify-center gap-1.5">
          {cover && (
            <button
              type="button"
              aria-label="Go to cover"
              onClick={() => onSelectCover?.()}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                atCover ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent/15'
              }`}
            >
              Cover
            </button>
          )}
          {Array.from({ length: total }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              aria-label={`Go to page ${pageIndex + 1}`}
              onClick={() => onChange(pageIndex)}
              className={`h-1.5 rounded-full transition-all ${
                !atCover && pageIndex === index ? 'w-6 bg-accent' : 'w-1.5 bg-border hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={goNext}
          disabled={!canNext}
          className="h-10 gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Next page
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {atCover ? 'Cover' : `Page ${index + 1} of ${total}`}
      </p>
    </div>
  );
}