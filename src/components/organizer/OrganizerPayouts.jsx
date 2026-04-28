import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertCircle, CheckCircle2, Clock, Loader2, ExternalLink, CreditCard, Users } from 'lucide-react';
import { isPast, format, addDays } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const PAYOUT_STATUS_STYLES = {
  pending: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  in_transit: 'bg-blue-50 border-blue-200 text-blue-700',
  completed: 'bg-green-50 border-green-200 text-green-700',
  failed: 'bg-red-50 border-red-200 text-red-700',
};

export default function OrganizerPayouts({ event, orders, promoters, payouts, currentUser, totalRevenue, platformFees }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [stripeAccountId, setStripeAccountId] = useState('');
  const [showBankForm, setShowBankForm] = useState(false);

  const isEventPast = isPast(new Date(event.date));
  const netPayout = totalRevenue - platformFees;
  const activePromoters = promoters.filter(p => p.status === 'active');
  const totalPromoterCommissions = activePromoters.reduce((s, p) => s + (p.total_commission_earned || 0), 0);
  const producerNet = netPayout - totalPromoterCommissions;
  const alreadyPaidOut = payouts.filter(p => p.payout_status === 'completed').reduce((s, p) => s + (p.net_payout || 0), 0);
  const pendingPayout = producerNet - alreadyPaidOut;

  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      if (!stripeAccountId.trim()) throw new Error('Please enter your Stripe account ID');
      const response = await base44.functions.invoke('processPayout', {
        eventId: event.id,
        organizerId: currentUser.id,
        amount: pendingPayout,
        stripeConnectAccountId: stripeAccountId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-payouts', event.id] });
      setShowBankForm(false);
      toast({ title: 'Payout Requested!', description: 'Your payout is being processed and will arrive in 2-5 business days.' });
    },
    onError: (err) => toast({ title: 'Payout Failed', description: err.message, variant: 'destructive' }),
  });

  const requestPromoterPayoutMutation = useMutation({
    mutationFn: async ({ promoter }) => {
      if (!promoter.stripe_account_id) throw new Error('Promoter has no Stripe account on file');
      const response = await base44.functions.invoke('processPayout', {
        eventId: event.id,
        organizerId: promoter.promoter_id || promoter.id,
        amount: promoter.total_commission_earned || 0,
        stripeConnectAccountId: promoter.stripe_account_id,
      });
      return response.data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['event-promoters', event.id] }); toast({ title: 'Promoter payout sent!' }); },
    onError: (err) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      {/* Event Status Warning */}
      {!isEventPast && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Payouts Available After Event</p>
            <p className="text-xs mt-1">Event date: {format(new Date(event.date), 'EEEE, MMMM d, yyyy · h:mm a')}. Payouts are released after the event ends.</p>
          </div>
        </div>
      )}

      {/* Financial Breakdown */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/20">
          <h3 className="font-bold text-foreground">Financial Summary</h3>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <Row label="Gross Ticket Sales" value={`$${totalRevenue.toFixed(2)}`} />
          <Row label="Platform Fees (5%)" value={`-$${platformFees.toFixed(2)}`} className="text-destructive" />
          <Row label="Net Revenue" value={`$${netPayout.toFixed(2)}`} bold />
          {totalPromoterCommissions > 0 && (
            <Row label="Promoter Commissions" value={`-$${totalPromoterCommissions.toFixed(2)}`} className="text-blue-600" />
          )}
          <div className="border-t border-border pt-3">
            <Row label="Your Take-Home" value={`$${producerNet.toFixed(2)}`} bold large className="text-accent" />
          </div>
          {alreadyPaidOut > 0 && (
            <Row label="Already Paid Out" value={`-$${alreadyPaidOut.toFixed(2)}`} className="text-green-600" />
          )}
          {alreadyPaidOut > 0 && (
            <Row label="Remaining to Pay Out" value={`$${pendingPayout.toFixed(2)}`} bold className="text-foreground" />
          )}
        </div>
      </div>

      {/* Payout Action */}
      {isEventPast && pendingPayout > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Request Payout</h3>
              <p className="text-xs text-muted-foreground">${pendingPayout.toFixed(2)} available · Arrives in 2-5 business days</p>
            </div>
          </div>

          {!showBankForm ? (
            <Button onClick={() => setShowBankForm(true)} className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-11">
              <CreditCard className="w-4 h-4" /> Request Payout - ${pendingPayout.toFixed(2)}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Enter your Stripe Connect account ID to receive your payout. <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">Find in Stripe Dashboard →</a></p>
              <input
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                placeholder="acct_xxxxxxxxxxxx"
                value={stripeAccountId}
                onChange={e => setStripeAccountId(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => requestPayoutMutation.mutate()}
                  disabled={requestPayoutMutation.isPending || !stripeAccountId.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  {requestPayoutMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  Confirm Payout
                </Button>
                <Button variant="outline" onClick={() => setShowBankForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Payout History</h3>
          {payouts.map(payout => (
            <div key={payout.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
              <div>
                <p className="font-medium text-foreground text-sm">${(payout.net_payout || 0).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{payout.created_date ? format(new Date(payout.created_date), 'MMM d, yyyy') : ''}</p>
                {payout.stripe_payout_id && <p className="text-xs text-muted-foreground font-mono">{payout.stripe_payout_id}</p>}
              </div>
              <Badge variant="outline" className={`text-xs ${PAYOUT_STATUS_STYLES[payout.payout_status] || ''}`}>
                {payout.payout_status}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Promoter Payouts */}
      {activePromoters.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-foreground">Promoter Payouts</h3>
          </div>
          {activePromoters.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">{p.promoter_name}</p>
                  <p className="text-xs text-muted-foreground">{p.promoter_email}</p>
                  <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{p.total_tickets_sold || 0} tickets</span>
                    <span>·</span>
                    <span>{p.commission_rate}% commission</span>
                    <span>·</span>
                    <span className="text-accent font-semibold">${(p.total_commission_earned || 0).toFixed(2)} owed</span>
                  </div>
                </div>
                {isEventPast && (p.total_commission_earned || 0) > 0 && (
                  <div className="text-right">
                    {p.stripe_account_id ? (
                      <Button
                        size="sm"
                        onClick={() => requestPromoterPayoutMutation.mutate({ promoter: p })}
                        disabled={requestPromoterPayoutMutation.isPending}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Pay Out
                      </Button>
                    ) : (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">No Stripe account</p>
                        <p className="text-xs text-muted-foreground">Contact manually</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/20">
          <h3 className="font-semibold text-foreground">Orders ({orders.length})</h3>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
        ) : (
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {orders.map(order => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{order.buyer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.order_number || `#${order.id?.slice(0, 8)}`} · {order.quantity} tickets</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="font-semibold text-foreground">${(order.total_amount || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">fee: ${(order.platform_fee || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, large, className }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${large ? 'text-lg' : ''} ${className || 'text-foreground'}`}>{value}</span>
    </div>
  );
}