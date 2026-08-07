import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function StripeVerifiedBadge({ size = 'sm' }) {
  const sizing = size === 'sm' ? 'text-[10px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const icon = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';
  return (
    <span
      className={`inline-flex items-center ${sizing} rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium uppercase tracking-wide`}
      title="This artist has completed payment setup"
    >
      <ShieldCheck className={icon} />
      Verified Seller
    </span>
  );
}