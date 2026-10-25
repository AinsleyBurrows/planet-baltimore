import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MagazinePager({ index, total, onChange, className = '' }) {
  if (!total) return null;
  const canPrev = index > 0;
  const canNext = index < total - 1;

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <Button
          variant="outline"
          onClick={() => onChange(index - 1)}
          disabled={!canPrev}
          className="h-10 gap-1.5 rounded-full px-4 text-xs font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex max-w-[45%] flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: total }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              type="button"
              aria-label={`Go to page ${pageIndex + 1}`}
              onClick={() => onChange(pageIndex)}
              className={`h-1.5 rounded-full transition-all ${
                pageIndex === index ? 'w-6 bg-accent' : 'w-1.5 bg-border hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={() => onChange(index + 1)}
          disabled={!canNext}
          className="h-10 gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
        >
          Next page
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Page {index + 1} of {total}
      </p>
    </div>
  );
}