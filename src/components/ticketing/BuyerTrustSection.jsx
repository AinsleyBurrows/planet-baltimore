import React from 'react';
import { Shield, Lock, RefreshCw } from 'lucide-react';

export default function BuyerTrustSection() {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 bg-accent/5 rounded-xl border border-accent/20">
      <div className="flex flex-col items-center gap-2 text-center">
        <Shield className="w-5 h-5 text-accent flex-shrink-0" />
        <p className="text-xs font-medium text-foreground">Secure Payment</p>
        <p className="text-[11px] text-muted-foreground">Stripe verified</p>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <Lock className="w-5 h-5 text-accent flex-shrink-0" />
        <p className="text-xs font-medium text-foreground">Data Protected</p>
        <p className="text-[11px] text-muted-foreground">End-to-end encrypted</p>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <RefreshCw className="w-5 h-5 text-accent flex-shrink-0" />
        <p className="text-xs font-medium text-foreground">Easy Refunds</p>
        <p className="text-[11px] text-muted-foreground">Money-back guarantee</p>
      </div>
    </div>
  );
}