import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  BringToFront,
  ChevronDown,
  ChevronUp,
  Expand,
  Layers,
  Maximize,
  Minus,
  MoveVertical,
  PanelLeft,
  PanelRight,
  SendToBack,
  Sun,
  Trash2,
} from 'lucide-react';
import { COVER_TEXT_COLORS, OVERLAY_ANCHORS, SPACE_STEPS } from '@/lib/magazineLayout';

const TEXT_ROLES = ['headline', 'subhead', 'body', 'quote', 'caption', 'masthead'];

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
export default function MagazineBlockToolbar({
  block,
  cover = false,
  isFirst,
  isLast,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}) {
  const wrapTo = (side) => {
    const narrow = !block.width || block.width >= 90 ? { width: 45 } : {};
    onUpdate({ float: side, ...narrow });
  };

  /* Cover controls: the photo can run to the sheet's edges, and any text can be
     laid over it, at three heights, in front of the photo or behind it. */
  const isCoverText = cover && TEXT_ROLES.includes(block.type);
  const anchor = block.overlay_anchor || (block.type === 'masthead' ? 'top' : 'bottom');
  const layer = block.overlay_layer || 'front';
  const anchorIcons = {
    top: <ArrowUp className="h-3.5 w-3.5" />,
    middle: <Minus className="h-3.5 w-3.5" />,
    bottom: <ArrowDown className="h-3.5 w-3.5" />,
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

      {cover && (block.type === 'image' || isCoverText) && <Divider />}

      {cover && block.type === 'image' && (
        <ToolButton
          label="Run the photo to the edges"
          active={!!block.bleed}
          onClick={() => onUpdate({ bleed: !block.bleed, float: 'full', width: 100 })}
        >
          <Expand className="h-3.5 w-3.5" />
        </ToolButton>
      )}

      {isCoverText && (
        <>
          <ToolButton
            label="Lay this text over the cover photo"
            active={!!block.overlay}
            onClick={() =>
              onUpdate(
                block.overlay ? { overlay: false } : { overlay: true, overlay_anchor: anchor, overlay_layer: layer },
              )
            }
          >
            <Layers className="h-3.5 w-3.5" />
          </ToolButton>
          {block.overlay && (
            <>
              {OVERLAY_ANCHORS.map((choice) => (
                <ToolButton
                  key={choice.value}
                  label={`Sit at the ${choice.label.toLowerCase()}`}
                  active={anchor === choice.value}
                  onClick={() => onUpdate({ overlay_anchor: choice.value })}
                >
                  {anchorIcons[choice.value]}
                </ToolButton>
              ))}
              <ToolButton
                label="In front of the photo"
                active={layer === 'front'}
                onClick={() => onUpdate({ overlay_layer: 'front' })}
              >
                <BringToFront className="h-3.5 w-3.5" />
              </ToolButton>
              <ToolButton
                label="Behind the photo"
                active={layer === 'behind'}
                onClick={() => onUpdate({ overlay_layer: 'behind' })}
              >
                <SendToBack className="h-3.5 w-3.5" />
              </ToolButton>
            </>
          )}
          <Divider />
          {COVER_TEXT_COLORS.map((choice) => (
            <button
              key={choice.label}
              type="button"
              aria-label={`${choice.label} text`}
              title={`${choice.label} text`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onUpdate({ text_color: choice.value })}
              style={{ backgroundColor: choice.value || '#f5f2ec' }}
              className={`h-4 w-4 shrink-0 rounded-full border border-border transition-transform ${
                (block.text_color || '') === choice.value ? 'ring-2 ring-accent ring-offset-1' : ''
              }`}
            />
          ))}
          <ToolButton
            label="Shadow behind the text"
            active={!!block.shadow}
            onClick={() => onUpdate({ shadow: !block.shadow })}
          >
            <Sun className="h-3.5 w-3.5" />
          </ToolButton>
        </>
      )}

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