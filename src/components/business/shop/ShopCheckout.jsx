import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShopCheckoutForm from './ShopCheckoutForm';

export default function ShopCheckout({ business, lines, subtotal, user, onClose, onPaid }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [noPayments, setNoPayments] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.functions
      .invoke('getStripeConfig', {})
      .then((res) => {
        if (!alive) return;
        const key = res.data?.publishableKey;
        if (key) setStripePromise(loadStripe(key));
        else setNoPayments(true);
      })
      .catch(() => alive && setNoPayments(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
        <button type="button" onClick={onClose} aria-label="Close checkout" className="rounded-full p-2 hover:bg-neutral-100">
          <X className="h-5 w-5 text-neutral-800" />
        </button>
        <p className="truncate px-3 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-900">
          {business.name}
        </p>
        <span className="hidden text-[11px] uppercase tracking-[0.15em] text-neutral-400 sm:block">Secure checkout</span>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8">
        {noPayments ? (
          <div className="flex items-start gap-3 border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Card payments are not available right now. Please contact the business to order.</p>
          </div>
        ) : stripePromise ? (
          <Elements stripe={stripePromise}>
            <ShopCheckoutForm
              business={business}
              lines={lines}
              subtotal={subtotal}
              user={user}
              onPaid={onPaid}
            />
          </Elements>
        ) : (
          <div className="flex items-center gap-2 py-24 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Preparing secure checkout…
          </div>
        )}
      </div>
    </div>
  );
}