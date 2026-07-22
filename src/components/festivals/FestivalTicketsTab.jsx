import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Ticket, Loader2, ShieldCheck, Lock } from 'lucide-react';
import TicketSelector from '@/components/ticketing/TicketSelector';

export default function FestivalTicketsTab({ festival, ticketTypes, preselectTicketTypeId }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState(() => (preselectTicketTypeId ? { [preselectTicketTypeId]: 1 } : {}));
  const [user, setUser] = useState(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const active = (ticketTypes || []).filter((tt) => {
    if (tt.is_active === false) return false;
    const now = new Date();
    if (tt.sale_start_date && new Date(tt.sale_start_date) > now) return false;
    if (tt.sale_end_date && new Date(tt.sale_end_date) < now) return false;
    return true;
  });

  const totalQty = Object.values(selected).reduce((s, q) => s + q, 0);
  const subtotal = Object.entries(selected).reduce((s, [id, q]) => {
    const tt = active.find((t) => t.id === id);
    return s + ((tt?.price || 0) * q);
  }, 0);
  const platformFee = subtotal * 0.05;
  const total = subtotal + platformFee;

  const checkout = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(selected).filter(([, q]) => q > 0);
      if (!entries.length) throw new Error('Select at least one ticket');
      const [firstTypeId, firstQty] = entries[0];
      const response = await base44.functions.invoke('createCheckoutSession', {
        festivalId: festival.id, ticketTypeId: firstTypeId, quantity: firstQty,
      });
      const { sessionId, url, free, orderId } = response.data;
      if (free) { navigate(`/order-confirmation?order_id=${orderId}`); return; }
      if (!url && !sessionId) throw new Error('Failed to create checkout session');
      window.location.href = url || `https://checkout.stripe.com/c/pay/${sessionId}`;
    },
    onError: (error) => toast({ title: 'Checkout Failed', description: error.message, variant: 'destructive' }),
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Sign in to get tickets</h3>
          <p className="text-sm text-muted-foreground">You need an account to purchase or reserve tickets.</p>
        </div>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.pathname)} className="text-white rounded-xl px-6" style={{ backgroundColor: '#d4580a' }}>
          Sign In to Continue
        </Button>
      </div>
    );
  }

  if (active.length === 0) {
    return (
      <div className="text-center py-10 bg-card border border-dashed border-border rounded-xl">
        <Ticket className="w-9 h-9 mx-auto text-muted-foreground opacity-30 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">No platform tickets available right now</p>
        <p className="text-xs text-muted-foreground mt-1">Check back closer to the festival date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Ticket className="w-5 h-5 text-[#d4580a]" />Platform Tickets
        </h3>
        <TicketSelector ticketTypes={active} selectedTickets={selected} onSelect={setSelected} />
      </div>

      {totalQty > 0 && (
        <div className="bg-secondary/60 rounded-xl p-4 space-y-1.5">
          {Object.entries(selected).map(([id, q]) => {
            const tt = active.find((t) => t.id === id);
            const lineTotal = (tt?.price || 0) * q;
            return (
              <div key={id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tt?.name} × {q}</span>
                <span className="font-medium text-foreground">{lineTotal === 0 ? 'Free' : `$${lineTotal.toFixed(2)}`}</span>
              </div>
            );
          })}
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
        onClick={() => checkout.mutate()}
        disabled={totalQty === 0 || checkout.isPending}
        className="w-full rounded-xl font-bold gap-2 text-white"
        style={{ height: 48, backgroundColor: '#d4580a' }}
      >
        {checkout.isPending ? (
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
  );
}