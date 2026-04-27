import React, { useState } from 'react';
import { AlertCircle, ChevronDown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function RefundPolicy({ event, ticketPrice }) {
  const [expanded, setExpanded] = useState(false);

  const eventDate = event?.date ? new Date(event.date) : null;
  const daysUntilEvent = eventDate ? Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const getRefundPolicy = () => {
    if (!daysUntilEvent) return { refundable: false, message: 'Date not set' };
    if (daysUntilEvent > 14) return { refundable: true, percentage: 100, days: daysUntilEvent };
    if (daysUntilEvent > 7) return { refundable: true, percentage: 75, days: daysUntilEvent };
    if (daysUntilEvent > 0) return { refundable: true, percentage: 50, days: daysUntilEvent };
    return { refundable: false, message: 'Event has started' };
  };

  const policy = getRefundPolicy();
  const refundAmount = policy.refundable ? (ticketPrice * policy.percentage / 100).toFixed(2) : 0;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">Refund Policy</p>
            <p className="text-xs text-muted-foreground">
              {policy.refundable ? `${policy.percentage}% refundable until ${policy.days} days before` : policy.message}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 bg-secondary/20 space-y-4 text-sm">
          {/* Timeline */}
          <div className="space-y-3">
            <p className="font-semibold text-foreground">Refund Timeline</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">100% refund</p>
                  <p className="text-xs text-muted-foreground">More than 14 days before event</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">75% refund</p>
                  <p className="text-xs text-muted-foreground">7-14 days before event</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">50% refund</p>
                  <p className="text-xs text-muted-foreground">0-7 days before event</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">No refunds</p>
                  <p className="text-xs text-muted-foreground">Event has started or no-show</p>
                </div>
              </div>
            </div>
          </div>

          {/* Processing */}
          <div className="space-y-2 pt-3 border-t border-border">
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Processing Time</p>
                <p className="text-xs text-muted-foreground">Refunds processed within 5-10 business days</p>
              </div>
            </div>
          </div>

          {/* Your specific case */}
          {policy.refundable && (
            <div className="pt-3 border-t border-border bg-green-500/10 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700">For this event:</p>
              <p className="text-xs text-green-700 mt-1">
                You can get ${refundAmount} back (${ticketPrice} × {policy.percentage}%) if requested by{' '}
                {eventDate ? eventDate.toLocaleDateString() : 'event date'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}