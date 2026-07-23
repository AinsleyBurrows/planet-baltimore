import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Upload, Ticket, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function HeadlinerEditor({ items, onChange, festivalId }) {
  const list = Array.isArray(items) ? items : [];
  const update = (i, k, v) => onChange(list.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, { name: '', image: '', day: '', time: '', stage: '', bio: '', ticket_type_id: '' }]);

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(list);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  };

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['festival-ticket-types', festivalId],
    queryFn: () => base44.entities.TicketType.filter({ festival_id: festivalId }, 'sort_order', 200),
    enabled: !!festivalId,
  });

  const upload = async (i, file) => {
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update(i, 'image', file_url);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Headliners</Label>
        <button type="button" onClick={add} className="text-xs flex items-center gap-1 text-[#d4580a] font-medium hover:underline">
          <Plus className="w-3.5 h-3.5" />Add headliner
        </button>
      </div>
      {list.length === 0 && <p className="text-xs text-muted-foreground">No headliners yet. Add one to make it feel like a headliner.</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="headliners">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
              {list.map((h, i) => {
                const dayLabel = h.day ? new Date(h.day + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                const meta = [dayLabel, h.time, h.stage].filter(Boolean).join(' · ');
                return (
                  <Draggable key={`hl-${i}`} draggableId={`hl-${i}`} index={i}>
                    {(prov, snap) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        className={`border border-border rounded-xl overflow-hidden ${snap.isDragging ? 'shadow-2xl ring-2 ring-[#d4580a]' : ''}`}
                      >
                        {/* Big tombstone preview */}
                        <div className="relative h-44 bg-muted">
                          {h.image ? (
                            <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-accent/40 font-black text-5xl">
                              {h.name ? h.name.charAt(0) : '?'}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          {/* Order controls */}
                          <div className="absolute top-2 right-2 flex items-center gap-1.5">
                            <div
                              {...prov.dragHandleProps}
                              className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Move up">
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title="Move down">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors" title="Remove">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm">#{i + 1}</span>
                          <div className="absolute bottom-2 left-3 right-3">
                            <p className="text-white font-bold text-xl leading-tight drop-shadow">{h.name || 'Untitled headliner'}</p>
                            {meta && <p className="text-white/85 text-xs mt-0.5">{meta}</p>}
                          </div>
                        </div>

              {/* Fields */}
              <div className="p-3 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <Input value={h.name || ''} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Headliner name" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Stage</span>
                    <Input value={h.stage || ''} onChange={(e) => update(i, 'stage', e.target.value)} placeholder="Main Stage" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Day</span>
                    <Input type="date" value={h.day || ''} onChange={(e) => update(i, 'day', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Time</span>
                    <Input value={h.time || ''} onChange={(e) => update(i, 'time', e.target.value)} placeholder="9:00 PM" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Bio</span>
                  <Textarea value={h.bio || ''} onChange={(e) => update(i, 'bio', e.target.value)} rows={2} placeholder="Short bio / description…" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Headliner image</span>
                  <div className="flex items-center gap-2">
                    <Input value={h.image || ''} onChange={(e) => update(i, 'image', e.target.value)} placeholder="https://…" className="flex-1" />
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-[#d4580a] font-medium hover:underline whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(i, e.target.files?.[0])} />
                    </label>
                  </div>
                </div>

                {/* Ticket section — linked to platform ticket types */}
                <div className="rounded-lg border border-dashed border-[#d4580a]/40 p-2.5 space-y-2 bg-[#d4580a]/5">
                  <p className="text-xs font-semibold text-[#d4580a] flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5" />Ticket type
                  </p>
                  {!festivalId ? (
                    <p className="text-xs text-muted-foreground">Save the festival first, then link a platform ticket type (created in the Admission section).</p>
                  ) : ticketTypes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No ticket types yet. Create one in the Admission section to link it here.</p>
                  ) : (
                    <Select value={h.ticket_type_id || '__none'} onValueChange={(v) => update(i, 'ticket_type_id', v === '__none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Link a platform ticket type…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None (free / RSVP)</SelectItem>
                        {ticketTypes.map((tt) => (
                          <SelectItem key={tt.id} value={tt.id}>{tt.name} — ${tt.price}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                 </div>
                </div>
                    )}
                  </Draggable>
                );
                })}
                {provided.placeholder}
              </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}