import React, { useState } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IncompleteProfileBanner({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 text-sm">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
      <p className="text-amber-800 flex-1">
        <span className="font-semibold">Profile incomplete</span> — Connect your Stripe account to sell tickets.{' '}
        <Link to="/settings" className="underline font-medium hover:text-amber-900">
          Go to Settings → Stripe Payments <ArrowRight className="w-3.5 h-3.5 inline" />
        </Link>
      </p>
      <button onClick={handleDismiss} className="p-1 rounded hover:bg-amber-100 text-amber-600 transition-colors" aria-label="Dismiss">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}