import React from 'react';
import { Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TicketTypeManager({ ticketTypes, selectedTickets, onSelect }) {
  if (ticketTypes.length === 0) {
    return (
      <div className="p-6 bg-secondary/30 rounded-xl flex items-center gap-3 text-sm text-muted-foreground">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>No tickets available for this event</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Select Tickets</h3>

      <div className="space-y-3">
        {ticketTypes.map(ticket => {
          const selected = selectedTickets[ticket.id] || 0;
          const remaining = (ticket.quantity_total || 0) - (ticket.quantity_sold || 0);
          const isSoldOut = remaining <= 0;
          const isLimited = remaining <= 5;

          return (
            <div
              key={ticket.id}
              className="border border-border rounded-xl p-4 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{ticket.name}</h4>
                  {ticket.description && (
                    <p className="text-xs text-muted-foreground mt-1">{ticket.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-accent">${ticket.price?.toFixed(2) || '0.00'}</p>
                  {ticket.original_price && ticket.original_price > ticket.price && (
                    <p className="text-xs line-through text-muted-foreground">
                      ${ticket.original_price?.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {isSoldOut ? (
                    <Badge className="bg-destructive/10 text-destructive border-0">Sold Out</Badge>
                  ) : isLimited ? (
                    <Badge className="bg-amber-500/10 text-amber-700 border-0 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {remaining} left
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {remaining} available
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelect({ ...selectedTickets, [ticket.id]: Math.max(0, selected - 1) })}
                    disabled={selected === 0 || isSoldOut}
                    className="px-2 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold text-foreground">{selected}</span>
                  <button
                    onClick={() => onSelect({ ...selectedTickets, [ticket.id]: Math.min(remaining, selected + 1) })}
                    disabled={selected >= remaining || isSoldOut}
                    className="px-2 py-1 rounded border border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}