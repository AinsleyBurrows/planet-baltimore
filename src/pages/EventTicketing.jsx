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

        {/* Professional header */}
        <div className="mb-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-100/50 rounded-xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-blue-900">Official Ticket Platform</p>
            <p className="text-blue-700">Secure checkout with Stripe. See the <button onClick={() => document.querySelector('[data-pricing-section]')?.scrollIntoView({ behavior: 'smooth' })} className="underline hover:text-blue-900">price breakdown</button>.</p>
          </div>
        </div>

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

        {/* Trust section */}
        <div className="mt-8 space-y-4">
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L7.414 9l3.293 3.293a1 1 0 11-1.414 1.414l-4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>PCI Compliant</strong> – No card data stored</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span><strong>SSL Encrypted</strong> – HTTPS secured</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000-2H6a1 1 0 000 2H5a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1h-1a1 1 0 000-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
              </svg>
              <span><strong>Money-back</strong> – If event cancelled</span>
            </div>
          </div>

          {/* Platform info */}
          <div className="text-center text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3">
            <p>BMore Connected uses <strong>industry-leading Stripe</strong> to process payments safely and securely</p>
          </div>
        </div>
      </div>
    </div>
  );
}