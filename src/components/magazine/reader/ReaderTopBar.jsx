import React from 'react';
import { ChevronLeft, Maximize2, Minimize2 } from 'lucide-react';

/**
 * The reader's masthead strip: which issue is open, where the reader is in it,
 * and the controls that belong to the book rather than the page.
 */
export default function ReaderTopBar({ magazine, label, backTo, fullscreen, onToggleFullscreen }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={backTo}
          aria-label="Close the reader"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{magazine.title}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.18em] text-white/45">
            {magazine.issue_label || 'Planet Baltimore'}
            {magazine.owner_name ? ` · ${magazine.owner_name}` : ''}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tabular-nums text-white/75">
          {label}
        </span>
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={fullscreen ? 'Leave full screen' : 'Read full screen'}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}