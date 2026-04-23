import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp } from 'lucide-react';

/**
 * Wraps any card with a discovery badge: "Recommended" or "Discover Something New"
 */
export default function DiscoverCard({ children, isNew = false, reason = '' }) {
  return (
    <div className="relative">
      {isNew && (
        <div className="absolute -top-1 right-3 z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-accent-foreground shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />New to You
          </span>
        </div>
      )}
      {!isNew && reason && (
        <div className="absolute -top-1 left-3 z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary shadow-sm">
            <TrendingUp className="w-2.5 h-2.5" />{reason}
          </span>
        </div>
      )}
      <div className={isNew || reason ? 'pt-3' : ''}>{children}</div>
    </div>
  );
}