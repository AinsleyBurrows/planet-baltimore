import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Loader2, Star, Ticket } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * HeadlinerReorderGrid — renders the festival headliners as poster-style
 * cards on the Overview tab. When `canManage` is true, the organizer can
 * drag to reorder; the new order is persisted to the Festival record
 * (highlights.headliners).
 *
 * Props:
 *  - festival: the shaped festival object
 *  - canManage: boolean — show drag handles + persist
 *  - onUpdate: optional callback fired with the updated festival after persist
 *  - onSelectHeadliner: optional callback(headliner) when a card is clicked
 *  - ticketTypes: list of TicketType records (for price display)
 */
export default function HeadlinerReorderGrid({
  festival,
  canManage,
  onUpdate,
  onSelectHeadliner,
  ticketTypes = [],
}) {
  const [headliners, setHeadliners] = useState(
    Array.isArray(festival?.highlights?.headliners) ? festival.highlights.headliners : []
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHeadliners(
      Array.isArray(festival?.highlights?.headliners) ? festival.highlights.headliners : []
    );
  }, [festival?.id, festival?.highlights?.headliners]);

  if (!headliners || headliners.length === 0) return null;

  const persist = async (reordered) => {
    if (!festival?.id || !canManage) return;
    setSaving(true);
    try {
      const nextHighlights = { ...(festival.highlights || {}), headliners: reordered };
      await base44.entities.Festival.update(festival.id, { highlights: nextHighlights });
      onUpdate?.({ ...festival, highlights: nextHighlights });
    } catch (e) {
      // revert on failure
      setHeadliners(Array.isArray(festival?.highlights?.headliners) ? festival.highlights.headliners : []);
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(headliners);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setHeadliners(next);
    persist(next);
  };

  const renderCard = (h, i, dragHandleProps, dragging, isButton) => {
    const dayLabel = h.day ? new Date(h.day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const meta = [dayLabel, h.time, h.stage].filter(Boolean).join(' · ');
    const tt = ticketTypes.find((t) => t.id === h.ticket_type_id);

    const inner = (
      <>
        {h.image ? (
          <img
            src={h.image}
            alt={h.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-accent/10 text-accent font-black text-6xl">
            {h.name?.charAt(0) || '?'}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {canManage && (
          <div
            {...(dragHandleProps || {})}
            className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/55 text-white backdrop-blur-sm cursor-grab active:cursor-grabbing hover:bg-black/75 transition-colors pointer-events-auto"
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
          <p className="font-bold text-xl leading-tight drop-shadow">{h.name}</p>
          {meta && <p className="text-xs text-white/85 mt-0.5">{meta}</p>}
          {h.bio && <p className="text-xs text-white/75 mt-1 line-clamp-2">{h.bio}</p>}
          <div className="flex items-center gap-2 mt-2.5">
            <span
              className={h.ticket_type_id
                ? 'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white'
                : 'inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#d4580a] text-[#d4580a] bg-[#d4580a]/10'}
              style={h.ticket_type_id ? { backgroundColor: '#d4580a' } : undefined}
            >
              <Ticket className="w-3.5 h-3.5" />
              {h.ticket_type_id ? 'Get Tickets' : 'RSVP'}
            </span>
            {tt ? <span className="text-xs font-semibold text-white/90">{tt.price === 0 ? 'Free' : `$${tt.price}`}</span> : null}
          </div>
        </div>
      </>
    );

    const className = `relative rounded-xl overflow-hidden border border-border bg-card aspect-[4/3] sm:aspect-square group text-left w-full interactive-card hover:border-[#d4580a]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${dragging ? 'shadow-2xl ring-2 ring-[#d4580a]' : ''}`;

    if (isButton) {
      return (
        <button
          key={i}
          type="button"
          onClick={() => onSelectHeadliner?.(h)}
          className={className}
        >
          {inner}
        </button>
      );
    }

    return (
      <div className={className}>
        {inner}
      </div>
    );
  };

  const hasSavingBadge = canManage && saving;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-foreground" />Festival Headliners
        </h3>
        {hasSavingBadge && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />Saving order…
          </span>
        )}
      </div>

      {canManage ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="overview-headliners">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
              >
                {headliners
                  .filter((h) => h && (h.name || h.image))
                  .map((h, i) => (
                    <Draggable
                      key={`ov-hl-${i}`}
                      draggableId={`ov-hl-${i}`}
                      index={i}
                    >
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          onClick={() => onSelectHeadliner?.(h)}
                          className="cursor-pointer"
                        >
                          {renderCard(h, i, prov.dragHandleProps, snap.isDragging, false)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {headliners
            .filter((h) => h && (h.name || h.image))
            .map((h, i) => renderCard(h, i, null, false, true))}
        </div>
      )}
    </div>
  );
}