import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Copy, Loader2, Trash2 } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function EventSelector({ events, selectedEvent, onSelect, onDuplicate, onDelete, isLoading }) {
  const [duplicatingId, setDuplicatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDuplicate = async (e, event) => {
    e.stopPropagation();
    setDuplicatingId(event.id);
    await onDuplicate?.(event);
    setDuplicatingId(null);
  };

  const handleDelete = async (e, event) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    setDeletingId(event.id);
    await onDelete?.(event);
    setDeletingId(null);
  };
  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading events...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
        <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground">No events created yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground font-medium">Select an Event</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {events.map(event => {
          const isPast_ = isPast(new Date(event.date));
          const isSelected = selectedEvent?.id === event.id;

          return (
            <button
              key={event.id}
              onClick={() => onSelect(event)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-primary/30 bg-card'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground line-clamp-1 pr-2">{event.title}</h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPast_ && <Badge variant="secondary" className="text-xs">Past</Badge>}
                  <button
                    onClick={(e) => handleDuplicate(e, event)}
                    title="Duplicate event"
                    className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {duplicatingId === event.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Copy className="w-3.5 h-3.5" />
                    }
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, event)}
                    title="Delete event"
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                  >
                    {deletingId === event.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </div>
                {event.venue_name && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.venue_name}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}