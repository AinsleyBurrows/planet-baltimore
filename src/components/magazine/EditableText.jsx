import React, { useEffect, useRef } from 'react';

/**
 * Inline text editing that keeps the page typography and lets the words keep
 * flowing around floated images while you type.
 *
 * The element is deliberately uncontrolled: React writes the text in once on
 * mount and reads it back on input, so the caret is never reset mid-sentence.
 */
export default function EditableText({ value, onChange, placeholder, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.innerText = value || '';
  }, []);

  return (
    <div className="relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        onInput={(event) => onChange(event.currentTarget.innerText)}
        className={`${className} outline-none`}
      />
      {!value?.trim() && (
        <span className="pointer-events-none absolute left-0 top-0 italic opacity-40">{placeholder}</span>
      )}
    </div>
  );
}