import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import PricingTransparency from './PricingTransparency';

export default function TicketSelector({ eventId, onSelectTickets }) {
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const { data: ticketTypes = [], isLoading } = useQuery({
    queryKey: ['ticket-types', eventId],
    queryFn: () => base44.entities.TicketType.filter({ event_id: eventId, is_active: true }, 'sort_order'),
    enabled: !!eventId,
  });

  const now = new Date();
  const visibleTickets = useMemo(() => {
    return ticketTypes.filter(t => {
      // Hide early birds that expired
      if (t.early_bird_expiry_date && new Date(t.early_bird_expiry_date) < now) return false;
      // Hide early birds that sold out
      if (t.early_bird_expiry_qty && (t.quantity_sold || 0) >= t.early_bird_expiry_qty) return false;
      // Hide sold out tickets
      const available = (t.quantity_total || 0) - (t.quantity_sold || 0);
      return available > 0;
    });
  }, [ticketTypes, now]);

  const selectedType = selectedTicketType && ticketTypes.find(t => t.id === selectedTicketType);
  const available = selectedType ? (selectedType.quantity_total || 0) - (selectedType.quantity_sold || 0) : 0;

  const validatePromo = async () => {
    setPromoError('');
    if (!promoCode.trim()) return;

    const codes = await base44.entities.PromoCode.filter({ code: promoCode.toUpperCase() });
    if (!codes.length) {
      setPromoError('Code not found');
      return;
    }

    const code = codes[0];
    if (!code.is_active) {
      setPromoError('Code not active');
      return;
    }

    if (code.usage_limit && code.usage_count >= code.usage_limit) {
      setPromoError('Code limit reached');
      return;
    }

    const checkDate = new Date();
    if (code.valid_from && new Date(code.valid_from) > checkDate) {
      setPromoError('Code not yet valid');
      return;
    }

    if (code.valid_until && new Date(code.valid_until) < checkDate) {
      setPromoError('Code expired');
      return;
    }

    if (code.ticket_type_whitelist?.length && !code.ticket_type_whitelist.includes(selectedTicketType)) {
      setPromoError('Code not valid for this ticket');
      return;
    }

    setAppliedPromo(code);
  };

  const calculatePrice = () => {
    if (!selectedType) return { subtotal: 0, discount: 0, total: 0, taxes: 0, fee: 0 };

    let subtotal = selectedType.price * quantity;
    let discount = 0;

    if (appliedPromo) {
      if (appliedPromo.discount_type === 'percentage') {
        discount = (subtotal * appliedPromo.discount_value) / 100;
      } else {
        discount = appliedPromo.discount_value * quantity;
      }
    }

    const discounted = Math.max(0, subtotal - discount);
    const fee = (discounted * 0.05) + (0.50 * quantity);
    const taxes = discounted * 0.08;
    const total = discounted + fee + taxes;

    return { subtotal, discount, taxes, fee, total };
  };

  const pricing = calculatePrice();
  const maxAllowed = selectedType?.max_per_buyer || available;

  const handleProceed = () => {
    if (!selectedType || quantity < 1) return;
    onSelectTickets({
      ticket_type_id: selectedType.id,
      quantity,
      promo_code: appliedPromo?.code || null,
      pricing,
    });
  };

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading tickets...</div>;
  }

  if (!visibleTickets.length) {
    return (
      <div className="text-center py-12 rounded-xl bg-secondary/40 border border-border">
        <p className="text-foreground font-semibold">No tickets available</p>
        <p className="text-sm text-muted-foreground mt-1">Check back later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-xs text-green-700"><strong>100% secure</strong> – Powered by Stripe, trusted by millions</span>
      </div>

      {/* Ticket types grid */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">Select Ticket Type</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleTickets.map(ticket => {
            const isAvailable = (ticket.quantity_total || 0) - (ticket.quantity_sold || 0) > 0;
            const isSoldOut = !isAvailable;
            const isSelected = selectedTicketType === ticket.id;

            return (
              <button
                key={ticket.id}
                onClick={() => !isSoldOut && setSelectedTicketType(ticket.id)}
                disabled={isSoldOut}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : isSoldOut
                    ? 'border-border bg-muted opacity-50 cursor-not-allowed'
                    : 'border-border hover:border-accent'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground flex items-center gap-2">
                      {ticket.name}
                      {ticket.ticket_type_group === 'early_bird' && (
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      )}
                    </p>
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                    )}
                    {ticket.perks?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ticket.perks.map((perk, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {perk}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {ticket.price === 0 ? 'FREE' : `$${ticket.price}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isSoldOut ? 'Sold Out' : `${(ticket.quantity_total || 0) - (ticket.quantity_sold || 0)} left`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantity + Promo */}
      {selectedType && (
        <div className="space-y-4 p-4 rounded-xl bg-secondary/40 border border-border">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={maxAllowed}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(maxAllowed, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 text-center border border-border rounded-lg px-2 py-2 font-medium"
              />
              <button
                onClick={() => setQuantity(Math.min(maxAllowed, quantity + 1))}
                className="w-10 h-10 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                +
              </button>
              <span className="text-xs text-muted-foreground ml-2">Max {maxAllowed}</span>
            </div>
          </div>

          {/* Promo code */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Promo Code (Optional)</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code..."
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                  if (appliedPromo?.code === e.target.value.toUpperCase()) return;
                  setAppliedPromo(null);
                }}
                className="flex-1"
                disabled={!!appliedPromo}
              />
              {!appliedPromo ? (
                <Button onClick={validatePromo} variant="outline" disabled={!promoCode.trim()}>
                  Apply
                </Button>
              ) : (
                <Button onClick={() => { setAppliedPromo(null); setPromoCode(''); }} variant="outline" className="text-green-600">
                  ✓ Applied
                </Button>
              )}
            </div>
            {promoError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{promoError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Price breakdown */}
      {selectedType && (
        <>
          <PricingTransparency
            subtotal={pricing.subtotal}
            discount={pricing.discount}
            fee={pricing.fee}
            tax={pricing.taxes}
            total={pricing.total}
          />

          <Card className="p-4 bg-card/60 border-border">
            <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal ({quantity} × ${selectedType.price})</span>
              <span className="font-medium">${pricing.subtotal.toFixed(2)}</span>
            </div>
            {pricing.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedPromo?.code})</span>
                <span>-${pricing.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform Fee</span>
              <span>+${pricing.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%)</span>
              <span>+${pricing.taxes.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span className="text-accent">${pricing.total.toFixed(2)}</span>
            </div>
          </div>
          </Card>
        </>
      )}

      {/* CTA */}
      <Button
        onClick={handleProceed}
        disabled={!selectedType || quantity < 1}
        className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold rounded-lg"
      >
        Continue to Checkout
      </Button>
    </div>
  );
}