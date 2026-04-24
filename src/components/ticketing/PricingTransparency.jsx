import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

export default function PricingTransparency({ subtotal, discount, fee, tax, total }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!subtotal) return null;

  return (
    <Card className="p-4 bg-blue-50/50 border-blue-200">
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full flex items-center justify-between text-left"
      >
        <p className="text-xs text-blue-900 font-medium">
          💡 See how your price is calculated
        </p>
        <ChevronDown className={`w-4 h-4 text-blue-700 transition-transform duration-200 ${showBreakdown ? 'rotate-180' : ''}`} />
      </button>

      {showBreakdown && (
        <div className="mt-3 space-y-2 pt-3 border-t border-blue-200/50 text-xs">
          <div className="flex justify-between text-blue-900">
            <span>Tickets (base price)</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Promo code discount</span>
              <span className="font-medium">-${discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-blue-900">
            <span>Platform fee (5% + $0.50/ticket)</span>
            <span className="font-medium">${fee.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-blue-900">
            <span>Sales tax (8%)</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>

          <div className="border-t border-blue-200/50 pt-2 flex justify-between font-bold text-blue-900">
            <span>You pay</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <p className="text-blue-700 mt-2 pt-2 border-t border-blue-200/50">
            ✓ Your ticket includes event organizer support and digital delivery<br/>
            ✓ Platform fee helps cover secure payment processing via Stripe
          </p>
        </div>
      )}
    </Card>
  );
}