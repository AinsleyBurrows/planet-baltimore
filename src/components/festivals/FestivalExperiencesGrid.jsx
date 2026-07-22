import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Palette, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function SectionTitle({ children, icon: Icon }) {
  return (
    <h3 className="font-bold text-foreground flex items-center gap-2 mb-3 mt-6 first:mt-0">
      {Icon && <Icon className="w-5 h-5 text-foreground" />}{children}
    </h3>
  );
}

function ExperienceCard({ e, dragHandleProps, dragging }) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-border bg-card aspect-[4/3] sm:aspect-square group w-full ${dragging ? 'shadow-2xl ring-2 ring-[#d4580a]' : ''}`}
    >
      {e.image ? (
        <img src={e.image} alt={e.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" draggable={false} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-accent/10 text-accent font-black text-6xl">{e.title?.charAt(0) || '?'}</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
        <p className="font-bold text-xl leading-tight drop-shadow">{e.title}</p>
        {(() => {
          const dayLabel = e.day ? new Date(e.day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
          const meta = [dayLabel, e.time, e.venue].filter(Boolean).join(' · ');
          return meta ? <p className="text-xs text-white/85 mt-0.5">{meta}</p> : null;
        })()}
        {e.description && <p className="text-xs text-white/75 mt-1 line-clamp-2">{e.description}</p>}
        {e.price && (
          <span className="inline-flex items-center mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: String(e.price).toLowerCase() === 'free' ? '#16a34a' : '#d4580a' }}>{e.price}</span>
        )}
      </div>
      {dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/55 text-white backdrop-blur-sm cursor-grab active:cursor-grabbing hover:bg-black/75 transition-colors pointer-events-auto"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}

export default function FestivalExperiencesGrid({ festival, canManage, onUpdate, setActiveDay, setTab }) {
  const [items, setItems] = useState(() => Array.isArray(festival?.experiences) ? festival.experiences : []);
  const [saving, setSaving] = useState(false);

  // keep in sync if the festival prop changes (e.g. after a DB refetch)
  useEffect(() => {
    setItems(Array.isArray(festival?.experiences) ? festival.experiences : []);
  }, [festival?.id, festival?.experiences]);

  if (!items || items.length === 0) return null;

  const persist = async (reordered) => {
    if (!festival?.id || !canManage) return;
    setSaving(true);
    try {
      await base44.entities.Festival.update(festival.id, { experiences: reordered });
    } catch (e) {
      // revert on failure
      setItems(Array.isArray(festival?.experiences) ? festival.experiences : []);
    } finally {
      setSaving(false);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(items);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setItems(next);
    onUpdate?.({ ...festival, experiences: next });
    persist(next);
  };

  const goToSchedule = (e) => {
    if (e.day) setActiveDay?.(e.day);
    setTab?.('schedule');
  };

  return (
    <div>
      <SectionTitle icon={Palette}>
        Featured Experiences
        {canManage && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <GripVertical className="w-3 h-3" />}
            drag to reorder
          </span>
        )}
      </SectionTitle>

      {canManage ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="experiences">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {items.map((e, i) => (
                  <Draggable key={(e.title || 'exp') + '-' + i} draggableId={String(i)} index={i}>
                    {(prov, snap) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        onClick={() => goToSchedule(e)}
                        className="cursor-pointer interactive-card hover:border-[#d4580a]/40"
                      >
                        <ExperienceCard e={e} dragHandleProps={prov.dragHandleProps} dragging={snap.isDragging} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((e, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSchedule(e)}
              className="relative rounded-xl overflow-hidden border border-border bg-card aspect-[4/3] sm:aspect-square group text-left w-full interactive-card hover:border-[#d4580a]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {e.image ? (
                <img src={e.image} alt={e.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-accent/10 text-accent font-black text-6xl">{e.title?.charAt(0) || '?'}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
                <p className="font-bold text-xl leading-tight drop-shadow">{e.title}</p>
                {(() => {
                  const dayLabel = e.day ? new Date(e.day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                  const meta = [dayLabel, e.time, e.venue].filter(Boolean).join(' · ');
                  return meta ? <p className="text-xs text-white/85 mt-0.5">{meta}</p> : null;
                })()}
                {e.description && <p className="text-xs text-white/75 mt-1 line-clamp-2">{e.description}</p>}
                {e.price && (
                  <span className="inline-flex items-center mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: String(e.price).toLowerCase() === 'free' ? '#16a34a' : '#d4580a' }}>{e.price}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}