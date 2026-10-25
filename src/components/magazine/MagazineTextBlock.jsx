import React from 'react';
import EditableText from './EditableText';
import { ROLE_CLASSES, DROP_CAP_CLASS, BLOCK_PLACEHOLDERS } from '@/lib/magazineLayout';

const TAGS = { headline: 'h2', subhead: 'p', body: 'p', quote: 'blockquote', caption: 'p' };

export default function MagazineTextBlock({ block, editable, dropCap, selected, onSelect, onUpdate }) {
  const classes = `${ROLE_CLASSES[block.type] || ROLE_CLASSES.body} whitespace-pre-line ${
    dropCap && block.type === 'body' ? DROP_CAP_CLASS : ''
  }`;

  if (editable) {
    return (
      <div
        onClick={onSelect}
        onFocus={onSelect}
        className={`cursor-text ${selected ? 'ring-1 ring-accent/50' : ''}`}
      >
        <EditableText
          value={block.text}
          onChange={(text) => onUpdate({ text })}
          placeholder={BLOCK_PLACEHOLDERS[block.type] || 'Text'}
          className={classes}
        />
      </div>
    );
  }

  if (!block.text?.trim()) return null;
  const Tag = TAGS[block.type] || 'p';
  return <Tag className={classes}>{block.text}</Tag>;
}