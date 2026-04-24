import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, Share2, Gift } from 'lucide-react';
import RSVPButton from './RSVPButton';

export default function EventTicketing({ event, rsvpCount, onShare, user }) {
  const [donationAmount, setDonationAmount] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDonationForm, setShowDonationForm] = useState(false);

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets', event.id],
    queryFn: () => base44.entities.Ticket.filter({ event_id: event.id }, 'sort_order'),
    enabled: event.ticketing_mode === 'platform' && !!event.id,
  });

  const activeTickets = tickets.filter(t => t.is_active);
  const allSoldOut = activeTickets.length > 0 && activeTickets.every(t => t.quantity_sold >= t.quantity_total);

  // RSVP-only mode
  if (event.ticketing_mode === 'rsvp_only') {
    return (
      <div className="sticky bottom-20 lg:bottom-4 bg-background/95 backdrop-blur py-4 -mx-4 px-4 space-y-3">
        <div className="bg-secondary/40 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-2">This is an RSVP-only event</p>
          <RSVPButton eventId={event.id} rsvpCount={rsvpCount} />
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Share event"
            onClick={onShare}
            className="h-12 w-12 rounded-xl transition-all duration-150 active:scale-95"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Save event" className="h-12 w-12 rounded-xl transition-all duration-150 active:scale-95">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Platform ticketing mode
  if (event.ticketing_mode === 'platform') {
    return (
      <div className="sticky bottom-20 lg:bottom-4 bg-background/95 backdrop-blur py-4 -mx-4 px-4 space-y-4">
        <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Get Tickets</h3>
          
          {allSoldOut ? (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm font-medium text-center">
              All tickets sold out
            </div>
          ) : (
            <div className="space-y-2">
              {activeTickets.map(ticket => {
                const availableQty = ticket.quantity_total - ticket.quantity_sold;
                const isSoldOut = availableQty <= 0;
                
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    disabled={isSoldOut}
                    className={`w-full p-3 rounded-lg border-2 transition-all ${
                      selectedTicket?.id === ticket.id
                        ? 'border-accent bg-accent/10'
                        : isSoldOut
                        ? 'border-border bg-muted opacity-50 cursor-not-allowed'
                        : 'border-border hover:border-accent bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-medium text-foreground">{ticket.name}</p>
                        {ticket.description && (
                          <p className="text-xs text-muted-foreground">{ticket.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isSoldOut ? 'Sold out' : `${availableQty} left`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedTicket && !allSoldOut && (
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 rounded-lg font-semibold">
              Buy Ticket
              {selectedTicket.price > 0 && ` - $${selectedTicket.price}`}
            </Button>
          )}
        </div>

        {/* Donation section */}
        {event.allow_donations && (
          <div className="bg-secondary/40 rounded-xl p-4 space-y-3">
            <button
              onClick={() => setShowDonationForm(!showDonationForm)}
              className="w-full flex items-center justify-between font-semibold text-foreground hover:text-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Support this event
              </span>
              <span className="text-sm text-muted-foreground">Optional</span>
            </button>
            
            {showDonationForm && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 25].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setDonationAmount(amt.toString())}
                      className={`p-2 rounded-lg border transition-all text-sm font-medium ${
                        donationAmount === amt.toString()
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border hover:border-accent'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Custom amount"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-accent text-sm"
                />
                {donationAmount && (
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-10 rounded-lg text-sm font-semibold">
                    Donate ${parseFloat(donationAmount).toFixed(2)}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Share event"
            onClick={onShare}
            className="h-12 w-12 rounded-xl transition-all duration-150 active:scale-95"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="icon" aria-label="Save event" className="h-12 w-12 rounded-xl transition-all duration-150 active:scale-95">
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  // External ticketing mode (legacy)
  return (
    <div className="sticky bottom-20 lg:bottom-4 bg-background/95 backdrop-blur py-4 -mx-4 px-4 flex gap-3">
      {event.ticket_url && (
        <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 h-12 rounded-xl">
            <ExternalLink className="w-4 h-4" />Get Tickets
          </Button>
        </a>
      )}
      <RSVPButton eventId={event.id} rsvpCount={rsvpCount} />
      <Button
        variant="outline"
        size="icon"
        aria-label="Share event"
        onClick={onShare}
        className="h-12 w-12 rounded-xl transition-all duration-150 active:scale-95"
      >
        <Share2 className="w-5 h-5" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Save event" className="h-12 w-12 rounded-xl transition-all duration-150 active:scale-95">
        <Heart className="w-5 h-5" />
      </Button>
    </div>
  );
}