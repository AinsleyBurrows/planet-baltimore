import React from 'react';
import { ExternalLink } from 'lucide-react';
import EditableText from './EditableText';
import { layoutClass, blockStyle } from '@/lib/magazineLayout';

const ADVERT_LABEL = 'font-sans uppercase tracking-[0.18em] text-neutral-500 text-[10px] leading-none';

/**
 * A sponsored plate. Floats like an image so adverts can sit inside the text
 * column, and links out through its call-to-action when a reader clicks it.
 */
export default function MagazineAdvertBlock({ block, editable, selected, dragging, onSelect, onStartDrag, onUpdate }) {
  const sized = { ...block, float: block.float || 'full', width: block.width || 100 };
  const width = blockStyle(sized);
  const layout = layoutClass(sized);
  const plateClasses = `${layout} relative m-0 border border-neutral-300 bg-white/75 px-5 py-5 ${
    selected ? 'ring-2 ring-accent/50' : ''
  } ${dragging ? 'opacity-70' : ''}`;

  const hasLink = !!block.url?.trim();

  if (!editable) {
    return (
      <aside className={plateClasses} style={width}>
        <span className={ADVERT_LABEL}>Advertisement</span>
        {block.advertiser?.trim() && (
          <p className="mt-3 font-serif text-xl font-bold leading-tight text-neutral-900">{block.advertiser}</p>
        )}
        {block.text?.trim() && (
          <p className="mt-2 whitespace-pre-line font-serif text-[15px] leading-relaxed text-neutral-700">
            {block.text}
          </p>
        )}
        {block.cta?.trim() && (
          <div className="mt-4 border-t border-neutral-200 pt-3">
            {hasLink ? (
              <a
                href={block.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition-colors hover:text-accent"
              >
                {block.cta} <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
                {block.cta}
              </span>
            )}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className={plateClasses} style={width} onClick={onSelect}>
      <div
        onPointerDown={onStartDrag}
        className="flex cursor-grab items-center justify-between gap-2 touch-none active:cursor-grabbing"
      >
        <span className={ADVERT_LABEL}>Advertisement</span>
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-neutral-400">Drag to move</span>
      </div>
      <EditableText
        value={block.advertiser}
        onChange={(advertiser) => onUpdate({ advertiser })}
        placeholder="Sponsor name"
        className="mt-3 font-serif text-xl font-bold leading-tight text-neutral-900"
      />
      <EditableText
        value={block.text}
        onChange={(text) => onUpdate({ text })}
        placeholder="What are you advertising?"
        className="mt-2 whitespace-pre-line font-serif text-[15px] leading-relaxed text-neutral-700"
      />
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-200 pt-3">
        <EditableText
          value={block.cta}
          onChange={(cta) => onUpdate({ cta })}
          placeholder="Button label"
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900"
        />
        <EditableText
          value={block.url}
          onChange={(url) => onUpdate({ url })}
          placeholder="Link (https://…)"
          className="flex-1 font-sans text-[11px] text-neutral-500 underline decoration-dotted"
        />
      </div>
    </aside>
  );
}