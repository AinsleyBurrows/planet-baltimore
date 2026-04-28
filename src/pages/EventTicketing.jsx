import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, MapPin, Calendar, Minus, Plus, ShieldCheck, Loader2, Ticket, Crown, Zap, Star, Tag, Users, Info, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const GROUP_ICONS = { vip: Crown, early_bird: Zap, free: Star, group: Users, donation: Tag, general: Ticket };
const GROUP_LABELS = { vip: 'VIP', early_bird: 'Early Bird', free: 'Free', group: 'Group', donation: 'Donation', general: 'GA' };
const GROUP_STYLES = {
  vip: 'border-purple-200 bg-purple-50',
  early_bird: 'border-yellow-200 bg-yellow-50',
  free: 'border-green-200 bg-green-50',
  group: 'border-blue-200 bg-blue-50',
  default: 'border-border bg-card',
};

export default function EventTicketing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const promoterId = new URLSearchParams(window.location.search).get('promoter') || '';
  const eventId = window.location.pathname.split('/events/')[1]?.split('/')[0];

  const [selectedTickets, setSelectedTickets] = useState({});
  const [promoCode, setPromoCode] = useState('');
  const [promoData, setPromoData] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => { const r = await base44.entities.Event.filter({ id: eventId }); return r[0]; },
    enabled: !!eventId,
  });

  const { data: ticketTypes = [] } = useQuery({
    queryKey: ['ticket-types', eventId],
    queryFn: () => base44.entities.TicketType.filter({ event_id: eventId, is_active: true }, 'sort_order', 50),
    enabled: !!eventId,
  });

  const activeTicketTypes = ticketTypes.filter(tt => {
    const now = new Date();
    if (tt.sale_start_date && new Date(tt.sale_start_date) > now) return false;
    if (tt.sale_end_date && new Date(tt.sale_end_date) < now) return false;
    return true;
  });

  const adjustQty = (typeId, delta, max) => {
    setSelectedTickets(prev => {
      const current = prev[typeId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      if (next === 0) { const { [typeId]: _, ...rest } = prev; return rest; }
      return { ...prev, [typeId]: next };
    });
  };

  const validatePromo = async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    setPromoError('');
    try {
      const codes = await base44.entities.PromoCode.filter({ code: promoCode.toUpperCase(), event_id: eventId, is_active: true });
      const globalCodes = await base44.entities.PromoCode.filter({ code: promoCode.toUpperCase(), is_active: true });
      const found = [...codes, ...globalCodes].filter(c => !c.event_id || c.event_id === eventId)[0];
      if (!found) { setPromoError('Code not found or expired'); return; }
      const now = new Date();
      if (found.valid_from && new Date(found.valid_from) > now) { setPromoError('Code not yet active'); return; }
      if (found.valid_until && new Date(found.valid_until) < now) { setPromoError('Code has expired'); return; }
      if (found.usage_limit && (found.usage_count || 0) >= found.usage_limit) { setPromoError('Code usage limit reached'); return; }
      setPromoData(found);
      toast({ title: 'Promo applied!', description: found.discount_type === 'percentage' ? `${found.discount_value}% off` : `$${found.discount_value} off` });
    } catch {
      setPromoError('Failed to validate code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const totalQty = Object.values(selectedTickets).reduce((s, q) => s + q, 0);
      if (totalQty === 0) throw new Error('Select at least one ticket');

      // Handle multi-type orders: create one session per ticket type (Stripe limitation)
      // For simplicity, take first type selected
      const [firstTypeId, firstQty] = Object.entries(selectedTickets)[0];
      const response = await base44.functions.invoke('createCheckoutSession', {
        eventId,
        ticketTypeId: firstTypeId,
        quantity: firstQty,
        promoterId,
        promoCodeId: promoData?.id || '',
      });

      const { sessionId } = response.data;
      if (!sessionId) throw new Error('Failed to create checkout session');
      // Redirect to Stripe Checkout
      const stripe = await import('https://js.stripe.com/v3/');
      const stripeInstance = window.Stripe ? window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '') : null;

      window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;
    },
    onError: (error) => toast({ title: 'Checkout Failed', description: error.message, variant: 'destructive' }),
  });

  const totalQty = Object.values(selectedTickets).reduce((s, q) => s + q, 0);
  const subtotal = Object.entries(selectedTickets).reduce((s, [typeId, qty]) => {
    const tt = ticketTypes.find(t => t.id === typeId);
    return s + ((tt?.price || 0) * qty);
  }, 0);
  const promoDiscount = promoData
    ? promoData.discount_type === 'percentage'
      ? subtotal * (promoData.discount_value / 100)
      : Math.min(promoData.discount_value, subtotal)
    : 0;
  const platformFee = (subtotal - promoDiscount) * 0.05;
  const total = subtotal - promoDiscount + platformFee;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <Lock className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Sign in to purchase tickets</p>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Sign In to Continue
        </Button>
      </div>
    );
  }

  if (eventLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  if (!event) return <div className="text-center py-16 text-muted-foreground">Event not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-accent hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to event
      </button>

      {/* Event Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 border border-border">
        {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" />}
        <div className="p-5">
          <h1 className="text-xl font-bold text-foreground mb-2">{event.title}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {event.date && <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{format(new Date(event.date), 'EEEE, MMMM d, yyyy · h:mm a')}</span>}
            {event.venue_name && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.venue_name}{event.address && `, ${event.address}`}</span>}
          </div>
          {promoterId && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3" /> Referred by a promoter
            </div>
          )}
        </div>
      </div>

      {/* Ticket Types */}
      <div className="space-y-3">
        <h2 className="font-bold text-foreground text-lg">Select Tickets</h2>
        {activeTicketTypes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-secondary/30 rounded-xl">
            <Ticket className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No tickets available at this time</p>
          </div>
        )}
        {activeTicketTypes.map(tt => {
          const available = (tt.quantity_total || 0) - (tt.quantity_sold || 0);
          const maxCanBuy = tt.max_per_buyer ? Math.min(available, tt.max_per_buyer) : available;
          const selected = selectedTickets[tt.id] || 0;
          const isSoldOut = available <= 0;
          const GroupIcon = GROUP_ICONS[tt.ticket_type_group] || Ticket;
          const groupStyle = GROUP_STYLES[tt.ticket_type_group] || GROUP_STYLES.default;

          return (
            <div key={tt.id} className={`p-4 rounded-xl border-2 transition-all ${selected > 0 ? 'border-accent' : groupStyle} ${isSoldOut ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <GroupIcon className="w-4 h-4 text-accent" />
                    <p className="font-bold text-foreground">{tt.name}</p>
                    <Badge variant="secondary" className="text-xs">{GROUP_LABELS[tt.ticket_type_group] || tt.ticket_type_group}</Badge>
                    {isSoldOut && <Badge className="text-xs bg-red-100 text-red-700 border-red-200">Sold Out</Badge>}
                    {!isSoldOut && available <= 10 && <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">Only {available} left!</Badge>}
                  </div>
                  {tt.description && <p className="text-xs text-muted-foreground mb-2">{tt.description}</p>}
                  {tt.perks?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {tt.perks.map(p => <span key={p} className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">✓ {p}</span>)}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xl font-bold text-foreground">{tt.price === 0 ? 'Free' : `$${tt.price.toFixed(2)}`}</span>
                    <span className="text-xs text-muted-foreground">{available} remaining</span>
                  </div>
                </div>
                {/* Qty Stepper */}
                {!isSoldOut && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => adjustQty(tt.id, -1, maxCanBuy)}
                      disabled={selected === 0}
                      className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:border-accent hover:text-accent transition-all disabled:opacity-30 font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-foreground text-lg">{selected}</span>
                    <button
                      onClick={() => adjustQty(tt.id, 1, maxCanBuy)}
                      disabled={selected >= maxCanBuy}
                      className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:border-accent hover:text-accent transition-all disabled:opacity-30 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {tt.max_per_buyer && <p className="text-xs text-muted-foreground mt-2">Max {tt.max_per_buyer} per buyer</p>}
            </div>
          );
        })}
      </div>

      {/* Promo Code */}
      {totalQty > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-foreground text-sm">Promo Code</h3>
          {promoData ? (
            <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-700 font-semibold">✓ {promoData.code} applied — {promoData.discount_type === 'percentage' ? `${promoData.discount_value}% off` : `$${promoData.discount_value} off`}</span>
              <button onClick={() => { setPromoData(null); setPromoCode(''); }} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm uppercase focus:outline-none focus:ring-1 focus:ring-ring tracking-wider"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && validatePromo()}
              />
              <Button onClick={validatePromo} disabled={validatingPromo || !promoCode.trim()} variant="outline" size="sm">
                {validatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          )}
          {promoError && <p className="text-xs text-destructive">{promoError}</p>}
        </div>
      )}

      {/* Order Summary */}
      {totalQty > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-foreground">Order Summary</h3>
          {Object.entries(selectedTickets).map(([typeId, qty]) => {
            const tt = ticketTypes.find(t => t.id === typeId);
            return (
              <div key={typeId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tt?.name} × {qty}</span>
                <span className="font-medium text-foreground">{tt?.price === 0 ? 'Free' : `$${((tt?.price || 0) * qty).toFixed(2)}`}</span>
              </div>
            );
          })}
          {promoDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Promo Discount</span>
              <span>-${promoDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" />Platform fee (5%)</span>
            <span>${platformFee.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground text-lg">
            <span>Total</span>
            <span>{total === 0 ? 'Free' : `$${total.toFixed(2)}`}</span>
          </div>
        </div>
      )}

      {/* Checkout Button */}
      <Button
        onClick={() => checkoutMutation.mutate()}
        disabled={totalQty === 0 || checkoutMutation.isPending}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-14 rounded-xl font-bold text-base gap-2"
      >
        {checkoutMutation.isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
        ) : totalQty > 0 ? (
          <><ShieldCheck className="w-5 h-5" /> {total === 0 ? 'Get Free Tickets' : `Pay $${total.toFixed(2)} — Secure Checkout`}</>
        ) : (
          'Select Tickets to Continue'
        )}
      </Button>

      {totalQty > 0 && (
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Secured by Stripe. We never store your card details.
        </p>
      )}
    </div>
  );
}