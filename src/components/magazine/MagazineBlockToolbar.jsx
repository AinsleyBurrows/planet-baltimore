import React from 'react';
import { AlignLeft, AlignRight, ArrowLeftRight, ChevronDown, ChevronUp, Maximize, Trash2 } from 'lucide-react';

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

export default function MagazineBlockToolbar({ block, isFirst, isLast, onUpdate, onMoveUp, onMoveDown, onDelete }) {
  const isImage = block.type === 'image';
  return (
    <div
      onPointerDown={(event) => event.stopPropagation()}
      className="absolute -top-3.5 right-0 z-20 flex items-center gap-0.5 rounded-full border border-border bg-card px-1 py-0.5 shadow-md"
    >
      {isImage && (
        <>
          <ToolButton label="Float left" active={block.float === 'left'} onClick={() => onUpdate({ float: 'left' })}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton label="Float right" active={block.float === 'right'} onClick={() => onUpdate({ float: 'right' })}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolButton>
          <ToolButton
            label="Full width"
            active={(block.float || 'full') === 'full'}
            onClick={() => onUpdate({ float: 'full' })}
          >
            <Maximize className="h-3.5 w-3.5" />
          </ToolButton>
          <div className="flex items-center gap-1 px-1">
            <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
            <input
              type="range"
              min="25"
              max="100"
              step="5"
              value={block.width || 100}
              aria-label="Image width"
              onChange={(event) => onUpdate({ width: Number(event.target.value) })}
              className="h-1 w-14 cursor-pointer accent-accent"
            />
          </div>
        </>
      )}
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