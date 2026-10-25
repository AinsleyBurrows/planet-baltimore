import React, { useRef } from 'react';
import { GripVertical } from 'lucide-react';
import MagazineTextBlock from './MagazineTextBlock';
import MagazineImageBlock from './MagazineImageBlock';
import MagazineAdvertBlock from './MagazineAdvertBlock';
import MagazineContinuedBlock from './MagazineContinuedBlock';
import MagazineMastheadBlock from './MagazineMastheadBlock';
import MagazineBlockToolbar from './MagazineBlockToolbar';
import useBlockDrag from '@/hooks/useBlockDrag';
import { OVERLAY_SLOTS, overlayKey, overlaySlotClass } from '@/lib/magazineLayout';

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

  /* Text laid over the cover photo leaves the column; everything else reads
     down the sheet in order. */
  const flowBlocks = blocks.filter((block) => !block.overlay);
  const overlayGroups = OVERLAY_SLOTS.map((slot) => ({
    ...slot,
    blocks: blocks.filter((block) => block.overlay && overlayKey(block) === `${slot.anchor}|${slot.layer}`),
  })).filter((group) => group.blocks.length > 0);

  /* The drop cap opens the story that begins on this page, so a story carried
     over from an earlier page never takes it. */
  const firstHeadline = flowBlocks.findIndex((block) => block.type === 'headline');
  const dropCapIndex =
    firstHeadline < 0
      ? -1
      : flowBlocks.findIndex((block, blockIndex) => block.type === 'body' && blockIndex > firstHeadline);

  const continuesOver =
    pageNumber < totalPages ? `Continued on page ${pageNumber + 1}` : 'Continued on the next page';
  const continuedFromLabel =
    pageNumber > 1 ? `Continued from page ${pageNumber - 1}` : 'Continued from the previous page';

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

  const renderBlock = (block, dropCap) => {
    const position = blocks.findIndex((item) => item.id === block.id);

    return (
      <div key={block.id} data-block-id={block.id} className="group relative">
        {editable && (
          <button
            type="button"
            aria-label="Drag to move this element"
            title="Drag to move this element"
            onPointerDown={(event) => startDrag(event, block)}
            className={`absolute -left-6 top-1 z-10 flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-opacity active:cursor-grabbing ${
              selectedId === block.id
                ? 'opacity-100'
                : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100'
            }`}
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        )}
        {block.type === 'image' ? (
          <MagazineImageBlock
            block={block}
            cover={compact}
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
        ) : block.type === 'masthead' ? (
          <MagazineMastheadBlock
            block={block}
            title={magazineTitle}
            editable={editable}
            selected={selectedId === block.id}
            onSelect={() => onSelect?.(block.id)}
            onUpdate={(updates) => patch(block.id, updates)}
          />
        ) : block.type === 'continued_on' || block.type === 'continued_from' ? (
          <MagazineContinuedBlock
            block={block}
            direction={block.type === 'continued_on' ? 'on' : 'from'}
            label={block.type === 'continued_on' ? continuesOver : continuedFromLabel}
            editable={editable}
            selected={selectedId === block.id}
            onSelect={() => onSelect?.(block.id)}
            onUpdate={(updates) => patch(block.id, updates)}
          />
        ) : (
          <MagazineTextBlock
            block={block}
            editable={editable}
            dropCap={dropCap}
            selected={selectedId === block.id}
            onSelect={() => onSelect?.(block.id)}
            onUpdate={(updates) => patch(block.id, updates)}
          />
        )}
        {editable && selectedId === block.id && (
          <MagazineBlockToolbar
            block={block}
            cover={compact}
            isFirst={position === 0}
            isLast={position === blocks.length - 1}
            onUpdate={(updates) => patch(block.id, updates)}
            onMoveUp={() => move(block.id, -1)}
            onMoveDown={() => move(block.id, 1)}
            onDelete={() => remove(block.id)}
          />
        )}
      </div>
    );
  };

  const renderGroup = (group) => (
    <div key={`${group.anchor}|${group.layer}`} className={overlaySlotClass(group.anchor, group.layer)}>
      {group.blocks.map((block) => renderBlock(block, false))}
    </div>
  );

  return (
    <div
      ref={pageRef}
      className={`relative mx-auto flex w-full max-w-[820px] flex-col border border-border/70 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.4)] ${
        compact ? 'min-h-[540px] sm:min-h-[900px]' : 'min-h-[1080px] sm:min-h-[1800px]'
      }`}
      style={{ backgroundColor: page?.bg_color || '#ffffff' }}
    >
      {overlayGroups.filter((group) => group.layer === 'behind').map(renderGroup)}

      <div className="flex-1 px-6 py-8 sm:px-12 sm:py-14">
        {flowBlocks.map((block, index) => renderBlock(block, index === dropCapIndex))}
        <div className="clear-both" />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/10 px-6 py-3 text-[9px] uppercase tracking-[0.22em] text-neutral-400 sm:px-12 sm:text-[10px]">
        <span className="truncate">
          {magazineTitle}
          {issueLabel ? ` · ${issueLabel}` : ''}
        </span>
        <span className="shrink-0">{footerRight || `${pageNumber} / ${totalPages}`}</span>
      </div>

      {overlayGroups.filter((group) => group.layer === 'front').map(renderGroup)}
    </div>
  );
}