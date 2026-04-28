import React, { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle2, XCircle, QrCode, User, Loader2, RotateCcw } from 'lucide-react';

export default function OrganizerCheckIn({ event, tickets, ticketTypes, orders }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [lastResult, setLastResult] = useState(null);

  const ttMap = Object.fromEntries((ticketTypes || []).map(t => [t.id, t]));
  const orderMap = Object.fromEntries((orders || []).map(o => [o.id, o]));

  const checkInMutation = useMutation({
    mutationFn: async ({ ticket, checkIn }) => {
      await base44.entities.Ticket.update(ticket.id, {
        is_checked_in: checkIn,
        checked_in_at: checkIn ? new Date().toISOString() : null,
      });
      if (checkIn) {
        await base44.entities.CheckIn.create({
          ticket_id: ticket.id,
          event_id: event.id,
          checked_in_at: new Date().toISOString(),
          check_in_method: 'manual_search',
        });
      }
      return { ticket, checkIn };
    },
    onSuccess: ({ ticket, checkIn }) => {
      queryClient.invalidateQueries({ queryKey: ['event-tickets', event.id] });
      setLastResult({ success: true, name: orderMap[ticket.order_id]?.buyer_name || 'Attendee', checkedIn: checkIn });
    },
    onError: () => setLastResult({ success: false }),
  });

  const checkedIn = tickets.filter(t => t.is_checked_in).length;
  const total = tickets.length;

  const filteredTickets = search
    ? tickets.filter(t => {
        const q = search.toLowerCase();
        const order = orderMap[t.order_id];
        return (
          t.unique_code?.toLowerCase().includes(q) ||
          t.ticket_number?.toLowerCase().includes(q) ||
          order?.buyer_name?.toLowerCase().includes(q) ||
          order?.buyer_email?.toLowerCase().includes(q) ||
          order?.order_number?.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Check-In Counter */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-2xl p-6 text-center">
        <p className="text-5xl font-bold text-foreground mb-1">{checkedIn}<span className="text-2xl text-muted-foreground">/{total}</span></p>
        <p className="text-sm text-muted-foreground mb-4">Attendees Checked In</p>
        <div className="h-3 bg-secondary rounded-full overflow-hidden mx-auto max-w-sm">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: total > 0 ? `${(checkedIn / total) * 100}%` : '0%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{total > 0 ? ((checkedIn / total) * 100).toFixed(0) : 0}% capacity</p>
      </div>

      {/* Last Result Feedback */}
      {lastResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${lastResult.success ? (lastResult.checkedIn ? 'bg-green-50 border-green-200' : 'bg-secondary border-border') : 'bg-red-50 border-red-200'}`}>
          {lastResult.success ? (
            lastResult.checkedIn ? (
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : (
              <RotateCcw className="w-8 h-8 text-muted-foreground flex-shrink-0" />
            )
          ) : (
            <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
          )}
          <div>
            <p className="font-semibold text-foreground">{lastResult.success ? lastResult.name : 'Check-in Failed'}</p>
            <p className="text-xs text-muted-foreground">{lastResult.success ? (lastResult.checkedIn ? '✓ Successfully checked in' : 'Check-in undone') : 'Ticket not found or error'}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          autoFocus
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="Search by name, email, order #, or ticket code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Results */}
      {search && filteredTickets.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-6">No tickets found for "{search}"</p>
      )}

      {filteredTickets.length > 0 && (
        <div className="space-y-2">
          {filteredTickets.map(ticket => {
            const order = orderMap[ticket.order_id];
            const tt = ttMap[ticket.ticket_type_id];
            return (
              <div key={ticket.id} className={`p-4 rounded-xl border flex items-center gap-4 ${ticket.is_checked_in ? 'bg-green-50 border-green-200' : 'bg-card border-border'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <p className="font-semibold text-foreground text-sm">{order?.buyer_name || 'Unknown'}</p>
                    {ticket.is_checked_in && <Badge className="text-xs bg-green-500 text-white border-0">Checked In</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{order?.buyer_email}</p>
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{tt?.name || 'Ticket'}</span>
                    <span>·</span>
                    <span className="font-mono">{ticket.unique_code?.slice(0, 16)}</span>
                    {ticket.is_checked_in && ticket.checked_in_at && (
                      <>
                        <span>·</span>
                        <span>{new Date(ticket.checked_in_at).toLocaleTimeString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => checkInMutation.mutate({ ticket, checkIn: !ticket.is_checked_in })}
                  disabled={checkInMutation.isPending}
                  className={ticket.is_checked_in
                    ? 'bg-secondary hover:bg-secondary/80 text-foreground text-xs gap-1'
                    : 'bg-green-600 hover:bg-green-700 text-white text-xs gap-1'
                  }
                >
                  {checkInMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                    ticket.is_checked_in ? <><RotateCcw className="w-3.5 h-3.5" /> Undo</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Check In</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* All Tickets List (when no search) */}
      {!search && (
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">All Tickets ({tickets.length})</h3>
          <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1">
            {tickets.map(ticket => {
              const order = orderMap[ticket.order_id];
              const tt = ttMap[ticket.ticket_type_id];
              return (
                <div key={ticket.id} className={`flex items-center justify-between p-3 rounded-lg border text-sm ${ticket.is_checked_in ? 'bg-green-50 border-green-200' : 'bg-card border-border'}`}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {ticket.is_checked_in
                      ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate text-xs">{order?.buyer_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{tt?.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => checkInMutation.mutate({ ticket, checkIn: !ticket.is_checked_in })}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${ticket.is_checked_in ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  >
                    {ticket.is_checked_in ? 'Checked In' : 'Check In'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}