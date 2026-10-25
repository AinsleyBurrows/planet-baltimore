import React from 'react';
import EditableText from './EditableText';
import {
  MASTHEAD_CLASS,
  layoutClass,
  blockWidth,
  textColorStyle,
  textShadowClass,
} from '@/lib/magazineLayout';

/**
 * The magazine's own name at newspaper-cover size. It reads the magazine's
 * title, so it stays in step with the publication, unless the editor types
 * something over it.
 */
export default function MagazineMastheadBlock({ block, title, editable, selected, onSelect, onUpdate }) {
  const layout = layoutClass(block, { fullIsDefault: true });

  if (editable) {
    return (
      <div
        onClick={onSelect}
        onFocus={onSelect}
        style={blockWidth(block)}
        className={`${layout} cursor-text ${selected ? 'ring-1 ring-accent/50' : ''}`}
      >
        <EditableText
          value={block.text}
          onChange={(text) => onUpdate({ text })}
          placeholder={title || 'Magazine name'}
          className={`${MASTHEAD_CLASS} ${textShadowClass(block)}`}
          style={{ ...textColorStyle(block), textAlign: block.align || undefined }}
        />
      </div>
    );
  }

  const text = block.text?.trim() || title;
  if (!text) return null;

  return (
    <h1 className={`${MASTHEAD_CLASS} ${textShadowClass(block)} ${layout}`} style={{ ...blockWidth(block), ...textColorStyle(block), textAlign: block.align || undefined }}>
      {text}
    </h1>
  );
}