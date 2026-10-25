import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drag behaviour for magazine elements.
 *
 * Dragging sideways decides which side of the sheet the element wraps on
 * (left / right / full width). Dragging up and down moves the element through
 * the text, and the words re-flow around it as you go.
 *
 * Positions are measured once when the drag starts, so the page never jitters
 * while the text re-wraps underneath the pointer.
 */
export default function useBlockDrag({ pageRef, blocks, onChange }) {
  const [draggingId, setDraggingId] = useState(null);
  const rectsRef = useRef([]);
  const latest = useRef({ blocks, onChange });

  useEffect(() => {
    latest.current = { blocks, onChange };
  });

  const startDrag = useCallback(
    (event, block) => {
      event.preventDefault();
      event.stopPropagation();
      const nodes = pageRef.current?.querySelectorAll('[data-block-id]') || [];
      rectsRef.current = Array.from(nodes).map((node) => {
        const rect = node.getBoundingClientRect();
        return { id: node.getAttribute('data-block-id'), mid: rect.top + rect.height / 2 };
      });
      setDraggingId(block.id);
    },
    [pageRef],
  );

  useEffect(() => {
    if (!draggingId) return undefined;

    const handleMove = (event) => {
      const pageEl = pageRef.current;
      if (!pageEl) return;
      const rect = pageEl.getBoundingClientRect();
      const across = (event.clientX - rect.left) / rect.width;
      const float = across < 0.34 ? 'left' : across > 0.66 ? 'right' : 'full';

      const others = rectsRef.current.filter((item) => item.id !== draggingId);
      let insertAt = others.length;
      for (let i = 0; i < others.length; i += 1) {
        if (event.clientY < others[i].mid) {
          insertAt = i;
          break;
        }
      }

      const { blocks: current, onChange: change } = latest.current;
      const from = current.findIndex((block) => block.id === draggingId);
      if (from < 0) return;
      const moving = current[from];
      /* A side wrap needs a side-sized box, so widen down to a column when a
         full-width element is dragged out to the left or right. */
      const width =
        (float === 'left' || float === 'right') && (moving.width || 100) >= 90 ? 45 : moving.width;
      if (from === insertAt && moving.float === float && moving.width === width) return;

      const rest = current.filter((block) => block.id !== draggingId);
      const next = [...rest];
      next.splice(insertAt, 0, { ...moving, float, width });
      change(next);
    };

    const stop = () => setDraggingId(null);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [draggingId, pageRef]);

  return { draggingId, startDrag };
}