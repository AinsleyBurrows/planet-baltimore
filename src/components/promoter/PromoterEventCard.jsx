import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PromoterEventCard({ event, sales, promoterRecord, onSelect }) {
  const totalTicketsSold = sales.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalCommission = sales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

  const eventDate = event.date ? new Date(event.date) : null;
  const daysUntilEvent = eventDate ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const eventPassed = daysUntilEvent && daysUntilEvent < 0;

  const handleClick = (e) => {
    if (onSelect) {
      e.preventDefault();
      onSelect();
    }
  };

  const content = (
    <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:-translate-y-[1px] active:translate-y-0 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
            {eventPassed ? (
              <Badge variant="secondary" className="text-xs">Past</Badge>
            ) : daysUntilEvent && daysUntilEvent <= 7 ? (
              <Badge className="text-xs bg-accent/20 text-accent border-0">Soon</Badge>
            ) : null}
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            {eventDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{format(eventDate, 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}
            {event.venue_name && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{event.venue_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-xs text-muted-foreground">Tickets Sold</p>
            <p className="font-bold text-foreground text-lg">{totalTicketsSold}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Commission</p>
            <p className="font-bold text-accent text-lg">${totalCommission.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Sales Activity</span>
          <span className="text-foreground font-medium">{promoterRecord?.commission_rate || 0}% commission</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.min((totalTicketsSold / 100) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Link to={`/events/${event.id}`} onClick={handleClick} className="block">
      {content}
    </Link>
  );
}