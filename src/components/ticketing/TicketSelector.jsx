import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Zap } from 'lucide-react';

export default function TicketSelector({ ticketTypes, selectedTickets, onSelect }) {
  const handleQuantityChange = (typeId, quantity) => {
    const newSelection = { ...selectedTickets };
    if (quantity <= 0) {
      delete newSelection[typeId];
    } else {
      newSelection[typeId] = quantity;
    }
    onSelect(newSelection);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground font-medium">Select Tickets</p>
      {ticketTypes.length === 0 ? (
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
          <Zap className="w-8 h-8 mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground">No ticket types available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ticketTypes.map(tt => {
            const available = (tt.quantity_total || 0) - (tt.quantity_sold || 0);
            const selected = selectedTickets[tt.id] || 0;

            return (
              <div key={tt.id} className="border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{tt.name}</h3>
                    {tt.description && (
                      <p className="text-xs text-muted-foreground mt-1">{tt.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold text-foreground">${tt.price}</p>
                    {available === 0 && (
                      <Badge variant="destructive" className="text-xs mt-1">Sold Out</Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {available} available
                    {tt.max_per_buyer && ` · Max ${tt.max_per_buyer} per person`}
                  </span>

                  {available > 0 && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleQuantityChange(tt.id, selected - 1)}
                        disabled={selected === 0}
                        className="w-8 h-8 rounded-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-medium text-foreground">{selected}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          const max = tt.max_per_buyer || available;
                          if (selected < max) {
                            handleQuantityChange(tt.id, selected + 1);
                          }
                        }}
                        disabled={selected >= (tt.max_per_buyer || available)}
                        className="w-8 h-8 rounded-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}