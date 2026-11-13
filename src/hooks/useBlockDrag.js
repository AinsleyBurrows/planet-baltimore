import { useCallback, useEffect, useRef, useState } from 'react';
import { overlayKey } from '@/lib/magazineLayout';

/**
 * Drag behaviour for magazine elements.
 *
 * Every element on the sheet moves the same way: pick it up by its handle (or
 * grab a photo or advert by its body) and drag.
 *
 * · Dragging up and down carries the element through the page, and the text
 *   re-flows around it as it goes — a thin rule marks where it will land.
 * · Dragging sideways narrows the element into a column and wraps the text
 *   beside it on the left or the right; back through the middle and it takes
 *   the full measure again.
 * · Text laid over a cover photo moves up and down between the top, middle and
 *   foot of the sheet.
 *
 * The first significant movement picks the gesture: mostly sideways means the
 * editor is choosing a side, mostly up and down means reordering, so a vertical
 * drag never narrows an element by accident.
 */

const LEAD = 8; // movement before the gesture is decided, in px
const SIDE = 0.34; // the outer third of the sheet wraps an element to that side

const measure = (pageEl, blocks) => {
  const pageRect = pageEl.getBoundingClientRect();
  const byId = new Map(blocks.map((block) => [block.id, block]));

  return Array.from(pageEl.querySelectorAll('[data-block-id]'))
    .map((node) => {
      const id = node.getAttribute('data-block-id');
      const rect = node.getBoundingClientRect();
      return {
        id,
        overlay: !!byId.get(id)?.overlay,
        top: rect.top - pageRect.top,
        top_viewport: rect.top,
        mid: rect.top + rect.height / 2,
        bottom: rect.top + rect.height - pageRect.top,
      };
    })
    .filter((item) => !item.overlay);
};

export default function useBlockDrag({ pageRef, blocks, onChange }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dropTop, setDropTop] = useState(null);
  const grab = useRef({ x: 0, y: 0 });
  const axis = useRef(null);
  const latest = useRef({ blocks, onChange });

  useEffect(() => {
    latest.current = { blocks, onChange };
  });

  const startDrag = useCallback((event, block) => {
    event.preventDefault();
    event.stopPropagation();
    grab.current = { x: event.clientX, y: event.clientY };
    axis.current = null;
    setDraggingId(block.id);
  }, []);

  const stop = () => {
    setDraggingId(null);
    setDropTop(null);
    axis.current = null;
  };

  const moveOverlay = (event, pageEl, current, change, moving) => {
    const pageRect = pageEl.getBoundingClientRect();
    const frac = (event.clientY - pageRect.top) / pageRect.height;
    const anchor = frac < 0.34 ? 'top' : frac < 0.67 ? 'middle' : 'bottom';
    const layer = moving.overlay_layer || 'front';
    const key = `${anchor}|${layer}`;

    const rest = current.filter((block) => block.id !== moving.id);
    const next = [...rest];
    const slot = rest.filter((block) => block.overlay && overlayKey(block) === key);

    if (slot.length) {
      const lastIndex = next.findIndex((block) => block.id === slot[slot.length - 1].id);
      next.splice(lastIndex + 1, 0, { ...moving, overlay_anchor: anchor });
    } else {
      next.push({ ...moving, overlay_anchor: anchor });
    }

    const unchanged =
      moving.overlay_anchor === anchor && next.map((block) => block.id).join('|') === current.map((block) => block.id).join('|');
    if (!unchanged) change(next);
  };

  useEffect(() => {
    if (!draggingId) return undefined;

    const handleMove = (event) => {
      const pageEl = pageRef.current;
      if (!pageEl) return;

      const dx = event.clientX - grab.current.x;
      const dy = event.clientY - grab.current.y;
      if (!axis.current && Math.abs(dx) + Math.abs(dy) > LEAD) {
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'across' : 'down';
      }

      const { blocks: current, onChange: change } = latest.current;
      const from = current.findIndex((block) => block.id === draggingId);
      if (from < 0) return;
      const moving = current[from];

      if (moving.overlay) {
        setDropTop(null);
        moveOverlay(event, pageEl, current, change, moving);
        return;
      }

      const others = measure(pageEl, current).filter((item) => item.id !== draggingId);
      const pageRect = pageEl.getBoundingClientRect();
      const across = (event.clientX - pageRect.left) / pageRect.width;

      /* The rule shows the gap the element will drop into. */
      const followedBy = others.find((item) => event.clientY < item.mid);
      setDropTop(followedBy ? followedBy.top : others.length ? others[others.length - 1].bottom : 24);

      let float = moving.float || 'full';
      if (axis.current === 'across') {
        float = across < SIDE ? 'left' : across > 1 - SIDE ? 'right' : 'full';
      }

      let width = moving.width;
      if (float === 'left' || float === 'right') {
        /* A column needs a column's measure. */
        if (!width || width >= 90) width = 45;
      } else if ((moving.float === 'left' || moving.float === 'right') && float === 'full') {
        width = 100;
      }

      const rest = current.filter((block) => block.id !== draggingId);
      const target = followedBy ? rest.findIndex((block) => block.id === followedBy.id) : rest.length;
      const next = [...rest];
      next.splice(target < 0 ? rest.length : target, 0, { ...moving, float, width });

      const order = (list) => list.map((block) => block.id).join('|');
      if (order(next) === order(current) && moving.float === float && moving.width === width) return;
      change(next);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }, [draggingId, pageRef]);

  return { draggingId, dropTop, startDrag };
}