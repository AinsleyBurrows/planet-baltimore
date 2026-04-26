import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertCircle } from 'lucide-react';
import { isPast, format } from 'date-fns';

export default function PayoutDashboard({ event, orders, promoters }) {
  const isEventPast = isPast(new Date(event.date));
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const platformFees = orders.reduce((sum, o) => sum + (o.platform_fee || 0), 0);
  const netPayout = totalRevenue - platformFees;

  return (
    <div className="space-y-6">
      {!isEventPast && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold">Payouts Available After Event</p>
            <p className="text-xs mt-1">Event {isEventPast ? 'ended' : 'ends'} {format(new Date(event.date), 'MMM d, yyyy h:mm a')}. Payouts will be available after that time.</p>
          </div>
        </div>
      )}

      {/* Payout Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Platform Fees</p>
          <p className="text-2xl font-bold text-destructive">${platformFees.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">(5% + payment processing)</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Your Net Payout</p>
          <p className="text-2xl font-bold text-primary">${netPayout.toFixed(2)}</p>
        </div>
      </div>

      {/* Payout Action */}
      {isEventPast && netPayout > 0 && (
        <Button
          disabled={orders.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg gap-2 h-12"
        >
          <DollarSign className="w-5 h-5" />
          Request Payout - ${netPayout.toFixed(2)}
        </Button>
      )}

      {/* Orders Breakdown */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Order Breakdown</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Orders</span>
                <span className="font-medium">{orders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Tickets</span>
                <span className="font-medium">{orders.reduce((sum, o) => sum + o.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Sales</span>
                <span className="font-medium">${totalRevenue.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-muted-foreground">Net (after fees)</span>
                <span className="font-semibold text-primary">${netPayout.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Promoter Payouts */}
      {promoters.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Promoter Commissions</h3>
          <div className="space-y-2">
            {promoters.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground text-sm">{p.promoter_name}</p>
                  <p className="text-xs text-muted-foreground">{p.total_tickets_sold || 0} tickets @ {p.commission_rate}%</p>
                </div>
                <p className="font-semibold text-accent">${(p.total_commission_earned || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}