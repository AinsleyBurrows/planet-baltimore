import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Calendar, Minus, Plus, ShieldCheck,
  Loader2, Ticket, Crown, Zap, Star, Tag, Users, Info,
  Lock, ChevronDown, ChevronUp, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const GROUP_ICONS = { vip: Crown, early_bird: Zap, free: Star, group: Users, donation: Tag, general: Ticket };
const GROUP_LABELS = { vip: 'VIP', early_bird: 'Early Bird', free: 'Free', group: 'Group', donation: 'Donation', general: 'GA' };
const GROUP_ACCENT = {
  vip: { badge: 'bg-purple-100 text-purple-700 border-purple-200', ring: 'ring-purple-400', dot: 'bg-purple-400' },
  early_bird: { badge: 'bg-amber-100 text-amber-700 border-amber-200', ring: 'ring-amber-400', dot: 'bg-amber-400' },
  free: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', ring: 'ring-emerald-400', dot: 'bg-emerald-400' },
  group: { badge: 'bg-blue-100 text-blue-700 border-blue-200', ring: 'ring-blue-400', dot: 'bg-blue-400' },
  donation: { badge: 'bg-pink-100 text-pink-700 border-pink-200', ring: 'ring-pink-400', dot: 'bg-pink-400' },
  general: { badge: 'bg-secondary text-secondary-foreground border-border', ring: 'ring-foreground/30', dot: 'bg-foreground/40' },
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
  const [showPromo, setShowPromo] = useState(false);
  const [user, setUser] = useState(null);
  const [waitlistJoined, setWaitlistJoined] = useState({});
  const [joiningWaitlist, setJoiningWaitlist] = useState({});

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Check which sold-out types user is already on waitlist for
  useEffect(() => {
    if (!user?.id || !eventId) return;
    base44.entities.Waitlist.filter({ event_id: eventId, user_id: user.id })
      .then(entries => {
        const joined = {};
        entries.forEach(e => { joined[e.ticket_type_id] = true; });
        setWaitlistJoined(joined);
      })
      .catch(() => {});
  }, [user?.id, eventId]);

  const joinWaitlist = async (tt) => {
    if (!user) { base44.auth.redirectToLogin(window.location.pathname); return; }
    setJoiningWaitlist(prev => ({ ...prev, [tt.id]: true }));
    await base44.entities.Waitlist.create({
      event_id: eventId,
      ticket_type_id: tt.id,
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      notified: false,
    });
    setWaitlistJoined(prev => ({ ...prev, [tt.id]: true }));
    setJoiningWaitlist(prev => ({ ...prev, [tt.id]: false }));
  };

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
      toast({ title: '🎉 Promo applied!', description: found.discount_type === 'percentage' ? `${found.discount_value}% off your order` : `$${found.discount_value} off your order` });
    } catch { setPromoError('Failed to validate code'); }
    finally { setValidatingPromo(false); }
  };

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(selectedTickets).filter(([, qty]) => qty > 0);
      if (entries.length === 0) throw new Error('Select at least one ticket');
      // Use first ticket type for the session (Stripe single-session)
      const [firstTypeId, firstQty] = entries[0];
      const response = await base44.functions.invoke('createCheckoutSession', {
        eventId, ticketTypeId: firstTypeId, quantity: firstQty,
        promoterId, promoCodeId: promoData?.id || '',
      });
      const { sessionId, free, orderId } = response.data;
      if (free) { navigate(`/order-confirmation?order_id=${orderId}`); return; }
      if (!sessionId) throw new Error('Failed to create checkout session');
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-accent" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-1">Sign in to get tickets</h2>
          <p className="text-muted-foreground text-sm">You need an account to purchase or reserve tickets.</p>
        </div>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)} className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 h-11 rounded-xl font-semibold">
          Sign In to Continue
        </Button>
      </div>
    );
  }

  if (eventLoading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!event) return <div className="text-center py-24 text-muted-foreground">Event not found</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{event.title}</p>
          {event.date && <p className="text-xs text-muted-foreground">{format(new Date(event.date), 'EEE, MMM d · h:mm a')}</p>}
        </div>
        {totalQty > 0 && (
          <div className="flex-shrink-0 bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full">
            {totalQty} selected
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-40">
        {/* Event Card */}
        <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
          {event.image_url && (
            <div className="h-44 overflow-hidden">
              <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <h1 className="text-2xl font-bold text-foreground mb-3">{event.title}</h1>
            <div className="space-y-2">
              {event.date && (
                <div className="flex items-center gap-2.5 text-sm text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-accent" />
                  </div>
                  <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')} · {format(new Date(event.date), 'h:mm a')}</span>
                </div>
              )}
              {event.venue_name && (
                <div className="flex items-center gap-2.5 text-sm text-foreground">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-accent" />
                  </div>
                  <span>{event.venue_name}{event.address && ` · ${event.address}`}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Types */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Tickets</h2>
          {activeTicketTypes.length === 0 ? (
            <div className="text-center py-14 bg-card border border-dashed border-border rounded-2xl">
              <Ticket className="w-10 h-10 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-muted-foreground font-medium">No tickets available right now</p>
              <p className="text-sm text-muted-foreground mt-1">Check back closer to the event date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTicketTypes.map(tt => {
                const available = (tt.quantity_total || 0) - (tt.quantity_sold || 0);
                const maxCanBuy = tt.max_per_buyer ? Math.min(available, tt.max_per_buyer) : Math.min(available, 10);
                const selected = selectedTickets[tt.id] || 0;
                const isSoldOut = available <= 0;
                const GroupIcon = GROUP_ICONS[tt.ticket_type_group] || Ticket;
                const accent = GROUP_ACCENT[tt.ticket_type_group] || GROUP_ACCENT.general;
                const isSelected = selected > 0;

                return (
                  <div
                    key={tt.id}
                    className={`relative rounded-2xl border-2 transition-all duration-200 bg-card overflow-hidden
                      ${isSelected ? 'border-accent shadow-md' : 'border-border hover:border-accent/40'}
                      ${isSoldOut ? 'opacity-60' : ''}
                    `}
                  >
                    {/* Selected indicator stripe */}
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />}

                    <div className="p-5 pl-6">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent.badge}`}>
                          <GroupIcon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-bold text-foreground text-base">{tt.name}</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${accent.badge}`}>
                              {GROUP_LABELS[tt.ticket_type_group] || tt.ticket_type_group}
                            </span>
                            {isSoldOut && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Sold Out</span>}
                            {!isSoldOut && available <= 10 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">⚡ {available} left</span>}
                          </div>

                          {tt.description && <p className="text-sm text-muted-foreground mb-2">{tt.description}</p>}

                          {tt.perks?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {tt.perks.map(p => (
                                <span key={p} className="inline-flex items-center gap-1 text-xs text-accent font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> {p}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <div>
                              <span className="text-2xl font-extrabold text-foreground">
                                {tt.price === 0 ? 'Free' : `$${tt.price.toFixed(2)}`}
                              </span>
                              {tt.price > 0 && <span className="text-xs text-muted-foreground ml-1">+ fees</span>}
                            </div>

                            {/* Waitlist button for sold-out */}
                            {isSoldOut && (
                              <Button
                                size="sm"
                                onClick={() => joinWaitlist(tt)}
                                disabled={waitlistJoined[tt.id] || joiningWaitlist[tt.id]}
                                className={waitlistJoined[tt.id]
                                  ? 'bg-secondary text-muted-foreground text-xs gap-1 h-8 pointer-events-none'
                                  : 'bg-accent hover:bg-accent/90 text-accent-foreground text-xs gap-1 h-8'
                                }
                              >
                                {joiningWaitlist[tt.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                  waitlistJoined[tt.id] ? <><CheckCircle2 className="w-3.5 h-3.5" /> On Waitlist</> :
                                  'Join Waitlist'}
                              </Button>
                            )}

                            {/* Quantity stepper */}
                            {!isSoldOut && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => adjustQty(tt.id, -1, maxCanBuy)}
                                  disabled={selected === 0}
                                  className="w-9 h-9 rounded-xl border-2 border-border flex items-center justify-center text-foreground hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center font-bold text-foreground text-lg tabular-nums">{selected}</span>
                                <button
                                  onClick={() => adjustQty(tt.id, 1, maxCanBuy)}
                                  disabled={selected >= maxCanBuy}
                                  className="w-9 h-9 rounded-xl border-2 border-border flex items-center justify-center text-foreground hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>

                          {tt.max_per_buyer && (
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                              <Info className="w-3 h-3" /> Max {tt.max_per_buyer} per order
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Promo Code */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowPromo(!showPromo)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              {promoData ? <span className="text-accent font-semibold">✓ Promo applied: {promoData.code}</span> : 'Have a promo code?'}
            </span>
            {showPromo ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showPromo && (
            <div className="px-5 pb-4 border-t border-border pt-4 space-y-3">
              {promoData ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-semibold">
                      {promoData.discount_type === 'percentage' ? `${promoData.discount_value}% off` : `$${promoData.discount_value} off`}
                    </span>
                  </div>
                  <button onClick={() => { setPromoData(null); setPromoCode(''); }} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-sm uppercase font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                    placeholder="PROMO CODE"
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && validatePromo()}
                  />
                  <Button onClick={validatePromo} disabled={validatingPromo || !promoCode.trim()} variant="outline" className="rounded-xl px-4">
                    {validatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              )}
              {promoError && (
                <div className="flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="w-3.5 h-3.5" /> {promoError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Spacer for sticky footer */}
        <div className="h-4" />
      </div>

      {/* Sticky Checkout Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {/* Mini order summary */}
          {totalQty > 0 && (
            <div className="bg-secondary/60 rounded-xl px-4 py-3 space-y-1.5">
              {Object.entries(selectedTickets).map(([typeId, qty]) => {
                const tt = ticketTypes.find(t => t.id === typeId);
                const lineTotal = (tt?.price || 0) * qty;
                return (
                  <div key={typeId} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tt?.name} × {qty}</span>
                    <span className="font-medium text-foreground">{lineTotal === 0 ? 'Free' : `$${lineTotal.toFixed(2)}`}</span>
                  </div>
                );
              })}
              {promoDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 font-medium">
                  <span>Promo discount</span>
                  <span>-${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Platform fee (5%)</span>
                <span>${platformFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-1.5 flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span>{total === 0 ? 'Free' : `$${total.toFixed(2)}`}</span>
              </div>
            </div>
          )}

          <Button
            onClick={() => checkoutMutation.mutate()}
            disabled={totalQty === 0 || checkoutMutation.isPending}
            className={`w-full h-13 rounded-xl font-bold text-base gap-2 transition-all
              ${totalQty > 0 ? 'bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20' : 'bg-secondary text-muted-foreground cursor-not-allowed'}
            `}
            style={{ height: '52px' }}
          >
            {checkoutMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
            ) : totalQty > 0 ? (
              <><ShieldCheck className="w-5 h-5" /> {total === 0 ? `Get ${totalQty} Free Ticket${totalQty > 1 ? 's' : ''}` : `Checkout — $${total.toFixed(2)}`}</>
            ) : (
              'Select tickets above to continue'
            )}
          </Button>
          {totalQty > 0 && (
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Secured by Stripe · We never store your card details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}