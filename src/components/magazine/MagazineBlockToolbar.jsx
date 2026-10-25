import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Maximize,
  MoveVertical,
  PanelLeft,
  PanelRight,
  Trash2,
} from 'lucide-react';
import { SPACE_STEPS } from '@/lib/magazineLayout';

function ToolButton({ label, onClick, disabled, active, danger, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`rounded-full p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? 'bg-accent text-accent-foreground'
          : danger
            ? 'text-destructive hover:bg-destructive/10'
            : 'text-muted-foreground hover:bg-secondary'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />;
}

function Slider({ label, icon, min, max, step = 1, value, onChange, widthClass = 'w-14' }) {
  return (
    <label className="flex items-center gap-1 px-1" title={label}>
      {icon}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`h-1 cursor-pointer accent-accent ${widthClass}`}
      />
    </label>
  );
}

/**
 * Layout controls for one element: wrap it beside the text, set its width,
 * align it, push it down the sheet, reorder it or delete it.
 */
export default function MagazineBlockToolbar({ block, isFirst, isLast, onUpdate, onMoveUp, onMoveDown, onDelete }) {
  const wrapTo = (side) => {
    const narrow = !block.width || block.width >= 90 ? { width: 45 } : {};
    onUpdate({ float: side, ...narrow });
  };

  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      className="absolute -top-3.5 right-0 z-20 flex max-w-[calc(100vw-3rem)] flex-wrap items-center justify-end gap-0.5 rounded-2xl border border-border bg-card px-1.5 py-1 shadow-md"
    >
      <ToolButton
        label="Wrap beside text on the left"
        active={block.float === 'left'}
        onClick={() => wrapTo('left')}
      >
        <PanelLeft className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton
        label="Wrap beside text on the right"
        active={block.float === 'right'}
        onClick={() => wrapTo('right')}
      >
        <PanelRight className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label="Full width" active={(block.float || 'full') === 'full'} onClick={() => onUpdate({ float: 'full' })}>
        <Maximize className="h-3.5 w-3.5" />
      </ToolButton>
      <Slider
        label="Element width"
        icon={<ArrowLeftRight className="h-3 w-3 text-muted-foreground" />}
        min={25}
        max={100}
        step={5}
        value={block.width || 100}
        onChange={(width) => onUpdate({ width })}
      />

      <Divider />

      <ToolButton
        label="Align text left"
        active={(block.align || 'left') === 'left'}
        onClick={() => onUpdate({ align: 'left' })}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label="Centre text" active={block.align === 'center'} onClick={() => onUpdate({ align: 'center' })}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label="Align text right" active={block.align === 'right'} onClick={() => onUpdate({ align: 'right' })}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolButton>

      <Divider />

      <Slider
        label="Space above element"
        icon={<MoveVertical className="h-3 w-3 text-muted-foreground" />}
        min={0}
        max={SPACE_STEPS}
        value={Number(block.space_before) || 0}
        onChange={(space_before) => onUpdate({ space_before })}
        widthClass="w-12"
      />

      <Divider />

      <ToolButton label="Move up" disabled={isFirst} onClick={onMoveUp}>
        <ChevronUp className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label="Move down" disabled={isLast} onClick={onMoveDown}>
        <ChevronDown className="h-3.5 w-3.5" />
      </ToolButton>
      <ToolButton label="Delete element" danger onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" />
      </ToolButton>
    </div>
  );
}