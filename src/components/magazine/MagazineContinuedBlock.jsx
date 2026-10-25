import React from 'react';
import EditableText from './EditableText';
import { CONTINUED_CLASS, layoutClass, blockWidth } from '@/lib/magazineLayout';

/**
 * The cue that carries a story over a page break: "Continued on page 12" at the
 * foot of one page, "Continued from page 11" at the top of the next. The page
 * number is worked out from where the element sits, so it stays right when
 * pages are added, removed or reordered.
 */
export default function MagazineContinuedBlock({
  block,
  label,
  direction,
  editable,
  selected,
  onSelect,
  onUpdate,
}) {
  const align = block.align || (direction === 'on' ? 'right' : 'left');
  const style = { textAlign: align, ...blockWidth(block) };
  const classes = `${CONTINUED_CLASS} ${
    direction === 'on' ? 'clear-both border-t pt-3 mt-5' : 'border-b pb-3 mb-5'
  } ${layoutClass(block, { fullIsDefault: true })}`;

  if (editable) {
    return (
      <div
        onClick={onSelect}
        onFocus={onSelect}
        className={`${classes} cursor-text ${selected ? 'ring-1 ring-accent/50' : ''}`}
      >
        <EditableText
          value={block.text}
          onChange={(text) => onUpdate({ text })}
          placeholder={label}
          className="outline-none"
          style={{ textAlign: align }}
        />
      </div>
    );
  }

  return (
    <p className={classes} style={style}>
      {block.text?.trim() || label}
    </p>
  );
}