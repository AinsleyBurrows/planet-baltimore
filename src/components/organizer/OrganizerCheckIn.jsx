import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CheckCircle2, XCircle, QrCode, List, User, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import QRScanner from './QRScanner';

export default function OrganizerCheckIn({ event, tickets, ticketTypes, orders }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [pendingId, setPendingId] = useState(null);

  const ttMap = Object.fromEntries((ticketTypes || []).map(t => [t.id, t]));
  const orderMap = Object.fromEntries((orders || []).map(o => [o.id, o]));

  const checkedIn = tickets.filter(t => t.is_checked_in).length;
  const total = tickets.length;

  // Core check-in via backend function
  const doCheckIn = async (uniqueCode) => {
    setPendingId(uniqueCode);
    setLastResult(null);
    try {
      const res = await base44.functions.invoke('checkInTicket', {
        uniqueCode,
        eventId: event.id,
      });
      queryClient.invalidateQueries({ queryKey: ['event-tickets', event.id] });
      setLastResult({ success: true, name: res.data?.attendee?.name || 'Attendee', alreadyCheckedIn: false });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Error';
      const alreadyIn = msg.toLowerCase().includes('already');
      setLastResult({ success: !alreadyIn, alreadyCheckedIn: alreadyIn, name: '', error: msg });
    } finally {
      setPendingId(null);
    }
  };

  // Undo check-in — direct entity update (no backend function covers this)
  const undoCheckIn = async (ticket) => {
    setPendingId(ticket.unique_code);
    await base44.entities.Ticket.update(ticket.id, { is_checked_in: false, checked_in_at: null });
    queryClient.invalidateQueries({ queryKey: ['event-tickets', event.id] });
    setLastResult({ success: true, name: orderMap[ticket.order_id]?.buyer_name || 'Attendee', undone: true });
    setPendingId(null);
  };

  const filteredTickets = search
    ? tickets.filter(t => {
        const q = search.toLowerCase();
        const order = orderMap[t.order_id];
        return (
          t.unique_code?.toLowerCase().includes(q) ||
          t.ticket_number?.toLowerCase().includes(q) ||
          order?.buyer_name?.toLowerCase().includes(q) ||
          order?.buyer_email?.toLowerCase().includes(q)
        );
      })
    : tickets;

  return (
    <div className="space-y-6">
      {/* Counter */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 border border-border rounded-2xl p-6 text-center">
        <p className="text-5xl font-bold text-foreground mb-1">
          {checkedIn}<span className="text-2xl text-muted-foreground">/{total}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-4">Attendees Checked In</p>
        <div className="h-3 bg-secondary rounded-full overflow-hidden mx-auto max-w-sm">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: total > 0 ? `${(checkedIn / total) * 100}%` : '0%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {total > 0 ? ((checkedIn / total) * 100).toFixed(0) : 0}% capacity
        </p>
      </div>

      {/* Last Result */}
      {lastResult && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          lastResult.alreadyCheckedIn ? 'bg-yellow-50 border-yellow-200' :
          lastResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {lastResult.alreadyCheckedIn
            ? <AlertCircle className="w-8 h-8 text-yellow-500 flex-shrink-0" />
            : lastResult.success
              ? <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
              : <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
          }
          <div>
            <p className="font-semibold text-foreground">
              {lastResult.alreadyCheckedIn ? 'Already Checked In'
                : lastResult.undone ? `${lastResult.name} — Undone`
                : lastResult.success ? `${lastResult.name} — Checked In!`
                : 'Check-In Failed'}
            </p>
            <p className="text-xs text-muted-foreground">
              {lastResult.error || (lastResult.undone ? 'Check-in status reversed' : lastResult.success ? '✓ Successfully checked in' : '')}
            </p>
          </div>
        </div>
      )}

      {/* QR vs List tabs */}
      <Tabs defaultValue="scanner">
        <TabsList className="w-full grid grid-cols-2 bg-secondary/50 border border-border rounded-xl p-1">
          <TabsTrigger value="scanner" className="rounded-lg gap-2 text-sm">
            <QrCode className="w-4 h-4" /> QR Scanner
          </TabsTrigger>
          <TabsTrigger value="list" className="rounded-lg gap-2 text-sm">
            <List className="w-4 h-4" /> Attendee List
          </TabsTrigger>
        </TabsList>

        {/* ── QR Scanner ── */}
        <TabsContent value="scanner" className="mt-5 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Point the camera at a ticket QR code to check in instantly.
          </p>
          <QRScanner onScan={doCheckIn} />
        </TabsContent>

        {/* ── Attendee List ── */}
        <TabsContent value="list" className="mt-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Search by name, email, or ticket code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filteredTickets.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-6">No tickets found.</p>
          )}

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredTickets.map(ticket => {
              const order = orderMap[ticket.order_id];
              const tt = ttMap[ticket.ticket_type_id];
              const isLoading = pendingId === ticket.unique_code;
              return (
                <div
                  key={ticket.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                    ticket.is_checked_in ? 'bg-green-50 border-green-200' : 'bg-card border-border'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <p className="font-medium text-foreground truncate">{order?.buyer_name || 'Unknown'}</p>
                      {ticket.is_checked_in && (
                        <Badge className="text-[10px] bg-green-500 text-white border-0 px-1.5 py-0">In</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate pl-5">{order?.buyer_email}</p>
                    <p className="text-xs text-muted-foreground pl-5">{tt?.name} · <span className="font-mono">{ticket.unique_code?.slice(0, 12)}</span></p>
                  </div>
                  <Button
                    size="sm"
                    disabled={isLoading}
                    onClick={() => ticket.is_checked_in ? undoCheckIn(ticket) : doCheckIn(ticket.unique_code)}
                    className={ticket.is_checked_in
                      ? 'bg-secondary hover:bg-secondary/80 text-foreground text-xs gap-1 h-8'
                      : 'bg-green-600 hover:bg-green-700 text-white text-xs gap-1 h-8'
                    }
                  >
                    {isLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : ticket.is_checked_in
                        ? <><RotateCcw className="w-3.5 h-3.5" /> Undo</>
                        : <><CheckCircle2 className="w-3.5 h-3.5" /> Check In</>
                    }
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}