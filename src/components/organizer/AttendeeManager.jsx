import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Mail } from 'lucide-react';

export default function AttendeeManager({ eventId, tickets, rsvps }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: users = [] } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => base44.entities.User.list(),
  });

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const going = rsvps.filter(r => r.status === 'going');
  const interested = rsvps.filter(r => r.status === 'interested');

  let filteredAttendees = [];
  if (filterStatus === 'all') {
    filteredAttendees = [...going, ...interested];
  } else if (filterStatus === 'going') {
    filteredAttendees = going;
  } else if (filterStatus === 'interested') {
    filteredAttendees = interested;
  }

  // Apply search
  filteredAttendees = filteredAttendees
    .map(r => ({ rsvp: r, user: userMap[r.user_id] }))
    .filter(x => x.user && (x.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || x.user.email?.toLowerCase().includes(searchQuery.toLowerCase())));

  const handleExportCSV = () => {
    const data = filteredAttendees.map(({ rsvp, user }) => ({
      Name: user.full_name,
      Email: user.email,
      Status: rsvp.status,
    }));

    const csv = [
      ['Name', 'Email', 'Status'],
      ...data.map(d => [d.Name, d.Email, d.Status]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendees.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All ({rsvps.length})</option>
            <option value="going">Going ({going.length})</option>
            <option value="interested">Interested ({interested.length})</option>
          </select>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Attendee list */}
      {filteredAttendees.length > 0 ? (
        <div className="space-y-2">
          {filteredAttendees.map(({ rsvp, user }) => (
            <div key={rsvp.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all duration-200">
              <Link
                to={`/profile/${user.id}`}
                className="flex items-center gap-3 flex-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="bg-accent/10 text-accent">
                    {user.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <Badge variant={rsvp.status === 'going' ? 'default' : 'secondary'}>
                  {rsvp.status === 'going' ? 'Going' : 'Interested'}
                </Badge>
                <a
                  href={`mailto:${user.email}`}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Email attendee"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {rsvps.length === 0 ? 'No RSVPs yet' : 'No attendees match your search'}
        </div>
      )}
    </div>
  );
}