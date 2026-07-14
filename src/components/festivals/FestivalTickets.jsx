import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, MapPin, Users, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FestivalTickets({ festivals = [] }) {
  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex items-start gap-3">
        <Ticket className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Most Baltimore festivals are free to attend!</p>
          <p className="text-xs text-muted-foreground mt-1">
            Some festivals offer VIP passes, paid workshops, or premium experiences. RSVP to secure your spot and get reminders.
          </p>
        </div>
      </div>

      {/* Festival ticket cards */}
      {festivals.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-2xl">
          <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No festival tickets available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {festivals.map(festival => (
            <div key={festival.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                {festival.image_url && (
                  <img src={festival.image_url} alt={festival.title} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground">{festival.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {festival.date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(festival.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {festival.venue_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {festival.venue_name}
                    </span>
                  )}
                  {festival.rsvp_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {festival.rsvp_count} attending
                    </span>
                  )}
                </div>

                {/* Price badge */}
                <div className="flex items-center gap-2">
                  {festival.is_free ? (
                    <span className="text-sm font-bold text-green-600">Free</span>
                  ) : (
                    <span className="text-sm font-bold text-foreground">Paid event</span>
                  )}
                  {festival.is_virtual && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Virtual</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link to={`/events/${festival.id}`} className="flex-1">
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                      {festival.is_free ? 'RSVP Now' : 'Get Tickets'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* What's included */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-3">What's included with RSVP</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            'Event reminders sent 2 hours before start',
            'Add to your personal calendar',
            'Get notified of schedule changes',
            'Connect with other attendees',
          ].map(item => (
            <li key={item} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}