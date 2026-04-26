import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Users, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import TicketSelector from '@/components/ticketing/TicketSelector';

export default function EventTicketing() {
  const navigate = useNavigate();
  const eventId = window.location.pathname.split('/events/')[1]?.split('/')[0];
  const [selectedTickets, setSelectedTickets] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const results = await base44.entities.Event.filter({ id: eventId });
      return results[0];
    },
    enabled: !!eventId,
  });

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['ticket-types', eventId],
    queryFn: () => base44.entities.TicketType.filter({ event_id: eventId }, 'sort_order', 50),
    enabled: !!eventId,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const quantity = Object.values(selectedTickets).reduce((sum, q) => sum + q, 0);
      if (quantity === 0) throw new Error('Select tickets');

      const response = await base44.functions.invoke('createCheckoutSession', {
        eventId,
        ticketTypeId: Object.keys(selectedTickets)[0],
        quantity,
        promoterId: new URLSearchParams(window.location.search).get('promoter') || '',
      });

      // Redirect to Stripe checkout
      if (response.sessionId) {
        window.location.href = `https://checkout.stripe.com/pay/${response.sessionId}`;
      }
    },
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center py-16">
        <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)}>
          Sign In to Buy Tickets
        </Button>
      </div>
    );
  }

  if (eventLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!event) {
    return <div className="text-center py-16 text-muted-foreground">Event not found</div>;
  }

  const totalQuantity = Object.values(selectedTickets).reduce((sum, q) => sum + q, 0);
  const totalPrice = Object.entries(selectedTickets).reduce((sum, [typeId, qty]) => {
    const ticketType = ticketTypes.find(t => t.id === typeId);
    return sum + ((ticketType?.price || 0) * qty);
  }, 0);
  const platformFee = totalPrice * 0.05;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-accent hover:underline mb-4 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="space-y-6">
        {/* Event Header */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">{event.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.date ? format(new Date(event.date), 'MMM d, yyyy h:mm a') : 'Date TBD'}
            </span>
            {event.venue_name && <span>{event.venue_name}</span>}
          </div>
          {event.description && <p className="text-sm text-muted-foreground mt-3">{event.description}</p>}
        </div>

        {/* Ticket Selection */}
        <TicketSelector ticketTypes={ticketTypes} selectedTickets={selectedTickets} onSelect={setSelectedTickets} />

        {/* Order Summary */}
        {totalQuantity > 0 && (
          <div className="bg-secondary/30 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tickets ({totalQuantity})</span>
                <span className="text-foreground">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="text-foreground">${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-accent">${(totalPrice + platformFee).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Checkout */}
        <Button
          onClick={() => checkoutMutation.mutate()}
          disabled={totalQuantity === 0 || checkoutMutation.isPending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-12 font-semibold gap-2"
        >
          {checkoutMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : totalQuantity > 0 ? (
            `Buy ${totalQuantity} Ticket${totalQuantity !== 1 ? 's' : ''} - $${(totalPrice + platformFee).toFixed(2)}`
          ) : (
            'Select Tickets'
          )}
        </Button>
      </div>
    </div>
  );
}