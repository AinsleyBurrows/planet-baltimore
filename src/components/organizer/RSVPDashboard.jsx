import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, Search, Users, Mail, Phone, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function RSVPDashboard({ eventId }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: rsvps = [], isLoading } = useQuery({
    queryKey: ['rsvps-detail', eventId],
    queryFn: () => base44.entities.RSVP.filter({ event_id: eventId }, '-created_date', 500),
    enabled: !!eventId,
  });

  const filtered = rsvps.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.attendee_name?.toLowerCase().includes(q) ||
      r.attendee_email?.toLowerCase().includes(q) ||
      r.attendee_city?.toLowerCase().includes(q) ||
      r.attendee_phone?.includes(q);
    return matchesStatus && matchesSearch;
  });

  const goingCount = rsvps.filter(r => r.status === 'going').length;
  const interestedCount = rsvps.filter(r => r.status === 'interested').length;

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'Status', 'Date'];
    const rows = filtered.map(r => [
      r.attendee_name || '',
      r.attendee_email || '',
      r.attendee_phone || '',
      r.attendee_city || '',
      r.status,
      new Date(r.created_date).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rsvps-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading attendees...</div>;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{rsvps.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total RSVPs</p>
        </div>
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-accent">{goingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Going</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{interestedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Interested</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search attendees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-md border border-input bg-transparent text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="going">Going</option>
          <option value="interested">Interested</option>
        </select>
        <Button onClick={exportCSV} variant="outline" size="sm" className="gap-1.5">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No RSVPs yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rsvp) => (
            <div key={rsvp.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground text-sm">
                      {rsvp.attendee_name || <span className="text-muted-foreground italic">No name provided</span>}
                    </p>
                    <Badge
                      variant="secondary"
                      className={rsvp.status === 'going' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}
                    >
                      {rsvp.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {rsvp.attendee_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${rsvp.attendee_email}`} className="hover:text-accent transition-colors">{rsvp.attendee_email}</a>
                      </span>
                    )}
                    {rsvp.attendee_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {rsvp.attendee_phone}
                      </span>
                    )}
                    {rsvp.attendee_city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {rsvp.attendee_city}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(rsvp.created_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}