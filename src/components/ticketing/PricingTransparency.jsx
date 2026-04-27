import React from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function PricingTransparency({ ticketPrice, quantity, platformFee, promoDiscount }) {
  const subtotal = ticketPrice * quantity;
  const discount = promoDiscount || 0;
  const total = subtotal + platformFee - discount;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        Pricing Breakdown
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1 rounded-full hover:bg-secondary">
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 text-xs text-muted-foreground space-y-2">
            <p><strong>Ticket Price:</strong> Cost set by event organizer</p>
            <p><strong>Platform Fee:</strong> Processing & payment gateway costs</p>
            <p><strong>Promo Discount:</strong> Applied when code is valid</p>
          </PopoverContent>
        </Popover>
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            {quantity > 1 ? `${quantity} Tickets` : 'Ticket'}
          </span>
          <span className="text-foreground font-medium">${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            Platform Fee
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-0.5">
                  <Info className="w-3 h-3 text-muted-foreground/60" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 text-xs">
                This covers payment processing, transaction security, and platform services.
              </PopoverContent>
            </Popover>
          </span>
          <span className="text-foreground font-medium">${platformFee.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Promo Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-border pt-2 flex justify-between font-semibold text-foreground">
          <span>Total Amount</span>
          <span className="text-lg text-accent">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}