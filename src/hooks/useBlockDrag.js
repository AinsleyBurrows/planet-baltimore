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

      const { blocks: current, onChange: change } = latest.current;
      const from = current.findIndex((block) => block.id === draggingId);
      if (from < 0) return;
      const moving = current[from];
      const overlaid = !!moving.overlay;

      /* Only elements sharing the dragged element's layer are neighbours, so a
         cover line never jumps into the column and vice versa. */
      const isOverlaid = (id) => !!current.find((block) => block.id === id)?.overlay;
      const others = rectsRef.current.filter((item) => item.id !== draggingId && isOverlaid(item.id) === overlaid);
      const followedBy = others.find((item) => event.clientY < item.mid);

      const float = overlaid ? moving.float : across < 0.34 ? 'left' : across > 0.66 ? 'right' : 'full';
      /* A side wrap needs a side-sized box, so widen down to a column when a
         full-width element is dragged out to the left or right. */
      const width = overlaid
        ? moving.width
        : (float === 'left' || float === 'right') && (moving.width || 100) >= 90
          ? 45
          : moving.width;

      const rest = current.filter((block) => block.id !== draggingId);
      /* Land where the dragged element is, measured against the block it is now
         sitting above rather than against the element's own index. */
      const target = followedBy ? rest.findIndex((block) => block.id === followedBy.id) : rest.length;
      const next = [...rest];
      next.splice(target < 0 ? rest.length : target, 0, { ...moving, float, width });

      const order = (list) => list.map((block) => block.id).join('|');
      if (order(next) === order(current) && moving.float === float && moving.width === width) return;
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