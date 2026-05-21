import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Download, Mail, CheckCircle2, XCircle, Clock, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  completed: 'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  refunded: 'bg-red-100 text-red-700 border-red-200',
  failed: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function OrganizerAttendeeList({ event, orders, tickets, ticketTypes }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketFilter, setTicketFilter] = useState('all');
  const [exportingRSVP, setExportingRSVP] = useState(false);

  const ttMap = Object.fromEntries((ticketTypes || []).map(t => [t.id, t]));

  let filtered = orders;
  if (statusFilter !== 'all') filtered = filtered.filter(o => o.payment_status === statusFilter);
  if (ticketFilter !== 'all') filtered = filtered.filter(o => o.ticket_type_id === ticketFilter);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(o =>
      o.buyer_name?.toLowerCase().includes(q) ||
      o.buyer_email?.toLowerCase().includes(q) ||
      o.order_number?.toLowerCase().includes(q)
    );
  }

  const handleExportCSV = () => {
    const rows = [
      ['Order #', 'Name', 'Email', 'Ticket Type', 'Qty', 'Amount', 'Status', 'Date'],
      ...filtered.map(o => [
        o.order_number || o.id,
        o.buyer_name,
        o.buyer_email,
        ttMap[o.ticket_type_id]?.name || o.ticket_type_id,
        o.quantity,
        `$${(o.total_amount || 0).toFixed(2)}`,
        o.payment_status,
        o.created_date ? format(new Date(o.created_date), 'yyyy-MM-dd HH:mm') : '',
      ])
    ].map(row => row.map(c => `"${c || ''}"`).join(',')).join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-attendees.csv`;
    a.click();
  };

  const handleExportRSVP = async () => {
    setExportingRSVP(true);
    const rsvps = await base44.entities.RSVP.filter({ event_id: event.id }, '-created_date', 500);
    const rows = [
      ['Name', 'Email', 'Phone', 'City', 'Status', 'RSVP Date'],
      ...rsvps.map(r => [
        r.attendee_name || '',
        r.attendee_email || '',
        r.attendee_phone || '',
        r.attendee_city || '',
        r.status || 'going',
        r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd HH:mm') : '',
      ])
    ].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-rsvps.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportingRSVP(false);
  };

  const ticketsForOrder = (orderId) => tickets.filter(t => t.order_id === orderId);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Search by name, email, or order #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={ticketFilter} onChange={e => setTicketFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">All Types</option>
            {ticketTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" /> Orders CSV
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportRSVP} disabled={exportingRSVP} className="gap-2">
            {exportingRSVP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            RSVPs CSV
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} of {orders.length} orders</p>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">No orders found</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(order => {
            const tt = ttMap[order.ticket_type_id];
            const orderTickets = ticketsForOrder(order.id);
            const checkedInCount = orderTickets.filter(t => t.is_checked_in).length;
            return (
              <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-foreground text-sm">{order.buyer_name}</p>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[order.payment_status] || ''}`}>
                        {order.payment_status}
                      </Badge>
                      {checkedInCount > 0 && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />{checkedInCount}/{orderTickets.length} checked in
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{order.buyer_email}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{order.order_number || `#${order.id?.slice(0, 8)}`}</span>
                      <span>·</span>
                      <span>{tt?.name || 'Ticket'} × {order.quantity}</span>
                      <span>·</span>
                      <span className="font-semibold text-foreground">${(order.total_amount || 0).toFixed(2)}</span>
                      <span>·</span>
                      <span>{order.created_date ? format(new Date(order.created_date), 'MMM d, h:mm a') : ''}</span>
                    </div>
                  </div>
                  <a href={`mailto:${order.buyer_email}`} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
                {/* Individual Tickets */}
                {orderTickets.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                    {orderTickets.map(t => (
                      <span key={t.id} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${t.is_checked_in ? 'bg-green-50 border-green-200 text-green-700' : 'bg-secondary border-border text-muted-foreground'}`}>
                        {t.is_checked_in ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {t.ticket_number || t.unique_code?.slice(0, 10)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}