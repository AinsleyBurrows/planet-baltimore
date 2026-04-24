import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import TicketSelector from '@/components/ticketing/TicketSelector';

export default function EventTicketing() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('select'); // select | checkout

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate('/'));
  }, [navigate]);

  const checkoutMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('createCheckoutSession', {
        event_id: eventId,
        ticket_type_id: data.ticket_type_id,
        quantity: data.quantity,
        promo_code: data.promo_code,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    },
    onError: (error) => {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Checkout failed');
    },
  });

  const handleSelectTickets = (selection) => {
    checkoutMutation.mutate(selection);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          aria-label="Go back"
          className="p-2 rounded-full hover:bg-secondary active:scale-90 transition-all mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Get Tickets</h1>
          <p className="text-muted-foreground mb-8">
            Select your ticket type and quantity below
          </p>

          {checkoutMutation.isPending ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-accent animate-spin" />
              <p className="text-muted-foreground">Preparing checkout...</p>
            </div>
          ) : (
            <TicketSelector eventId={eventId} onSelectTickets={handleSelectTickets} />
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex justify-center items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 font-bold">✓</span>
            Secure checkout
          </div>
          <div>•</div>
          <div className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 font-bold">✓</span>
            Powered by Stripe
          </div>
        </div>
      </div>
    </div>
  );
}