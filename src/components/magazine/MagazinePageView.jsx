import React, { useRef } from 'react';
import MagazineTextBlock from './MagazineTextBlock';
import MagazineImageBlock from './MagazineImageBlock';
import MagazineAdvertBlock from './MagazineAdvertBlock';
import MagazineBlockToolbar from './MagazineBlockToolbar';
import useBlockDrag from '@/hooks/useBlockDrag';

export default function MagazinePageView({
  page,
  pageNumber,
  totalPages,
  magazineTitle,
  issueLabel,
  editable = false,
  compact = false,
  footerRight,
  selectedId,
  onSelect,
  onChange,
}) {
  const pageRef = useRef(null);
  const blocks = page?.blocks || [];
  const { draggingId, startDrag } = useBlockDrag({ pageRef, blocks, onChange });
  const firstBody = blocks.findIndex((block) => block.type === 'body');

  const patch = (id, updates) =>
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...updates } : block)));

  const remove = (id) => {
    onChange(blocks.filter((block) => block.id !== id));
    if (selectedId === id) onSelect?.(null);
  };

  const move = (id, direction) => {
    const from = blocks.findIndex((block) => block.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };

  return (
    <div
      ref={pageRef}
      className={`relative mx-auto flex w-full max-w-[820px] flex-col border border-border/70 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.4)] ${
        compact ? 'min-h-[540px] sm:min-h-[900px]' : 'min-h-[1080px] sm:min-h-[1800px]'
      }`}
      style={{ backgroundColor: page?.bg_color || '#ffffff' }}
    >
      <div className="flex-1 px-6 py-8 sm:px-12 sm:py-14">
        {blocks.map((block, index) => (
          <div key={block.id} data-block-id={block.id} className="relative">
            {block.type === 'image' ? (
              <MagazineImageBlock
                block={block}
                editable={editable}
                selected={selectedId === block.id}
                dragging={draggingId === block.id}
                onSelect={() => onSelect?.(block.id)}
                onStartDrag={(event) => startDrag(event, block)}
                onUpdate={(updates) => patch(block.id, updates)}
              />
            ) : block.type === 'advert' ? (
              <MagazineAdvertBlock
                block={block}
                editable={editable}
                selected={selectedId === block.id}
                dragging={draggingId === block.id}
                onSelect={() => onSelect?.(block.id)}
                onStartDrag={(event) => startDrag(event, block)}
                onUpdate={(updates) => patch(block.id, updates)}
              />
            ) : (
              <MagazineTextBlock
                block={block}
                editable={editable}
                dropCap={index === firstBody}
                selected={selectedId === block.id}
                onSelect={() => onSelect?.(block.id)}
                onUpdate={(updates) => patch(block.id, updates)}
              />
            )}
            {editable && selectedId === block.id && (
              <MagazineBlockToolbar
                block={block}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                onUpdate={(updates) => patch(block.id, updates)}
                onMoveUp={() => move(block.id, -1)}
                onMoveDown={() => move(block.id, 1)}
                onDelete={() => remove(block.id)}
              />
            )}
          </div>
        ))}
        <div className="clear-both" />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/10 px-6 py-3 text-[9px] uppercase tracking-[0.22em] text-neutral-400 sm:px-12 sm:text-[10px]">
        <span className="truncate">
          {magazineTitle}
          {issueLabel ? ` · ${issueLabel}` : ''}
        </span>
        <span className="shrink-0">{footerRight || `${pageNumber} / ${totalPages}`}</span>
      </div>
    </div>
  );
}