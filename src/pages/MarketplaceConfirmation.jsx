import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Download, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function MarketplaceConfirmation() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Poll for up to 10 seconds for the webhook to fulfill the order
    let attempts = 0;
    const poll = async () => {
      attempts++;
      const user = await base44.auth.me().catch(() => null);
      if (!user) { setLoading(false); return; }

      const orders = await base44.entities.MarketplaceOrder.filter({
        buyer_id: user.id,
        payment_status: 'completed',
      }, '-created_date', 5).catch(() => []);

      const found = orders[0];
      if (found) {
        setOrder(found);
        setLoading(false);
      } else if (attempts < 10) {
        setTimeout(poll, 1000);
      } else {
        setLoading(false);
      }
    };
    poll();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Confirming your purchase…</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-12">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Purchase Complete!</h1>
        {order && (
          <>
            <p className="text-muted-foreground text-sm">Order #{order.order_number}</p>
            <p className="font-medium text-foreground">{order.listing_title}</p>
            <p className="text-lg font-bold text-accent">${order.amount?.toFixed(2)}</p>
          </>
        )}
        <p className="text-sm text-muted-foreground mt-2">A confirmation email has been sent to you.</p>
      </div>

      <div className="flex flex-col gap-3">
        {order?.download_url && (
          <a
            href={order.download_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Download Your File
          </a>
        )}
        <Link to="/marketplace">
          <Button variant="outline" className="w-full gap-2">
            <ShoppingBag className="w-4 h-4" /> Back to Marketplace
          </Button>
        </Link>
      </div>
    </div>
  );
}