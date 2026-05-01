import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ShoppingCart, Check, Loader2, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { loadStripe } from '@stripe/stripe-js';

export default function MarketplaceDetail() {
  const listingId = window.location.pathname.split('/').pop();
  const [user, setUser] = useState(null);
  const [buying, setBuying] = useState(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [purchasedOrder, setPurchasedOrder] = useState(null);
  const [stripeKey, setStripeKey] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    base44.functions.invoke('getStripeConfig', {})
      .then(res => setStripeKey(res.data?.publishableKey || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['marketplace-listing', listingId],
    queryFn: async () => {
      const results = await base44.entities.MarketplaceListing.filter({ id: listingId });
      return results[0] || null;
    },
    enabled: !!listingId,
    staleTime: 30000,
  });

  // Check if user already bought this
  useEffect(() => {
    if (!user?.id || !listingId) return;
    base44.entities.MarketplaceOrder.filter({ listing_id: listingId, buyer_id: user.id, payment_status: 'completed' })
      .then((orders) => {
        if (orders.length > 0) {
          setAlreadyPurchased(true);
          setPurchasedOrder(orders[0]);
        }
      })
      .catch(() => {});
  }, [user?.id, listingId]);

  const handleBuy = async () => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }
    setBuying(true);
    const res = await base44.functions.invoke('createMarketplaceCheckout', { listingId });
    const data = res.data;

    if (data.free) {
      setAlreadyPurchased(true);
      setPurchasedOrder({ download_url: data.downloadUrl, order_number: 'Free' });
      setBuying(false);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    if (data.sessionId && stripeKey) {
      const stripe = await loadStripe(stripeKey);
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    }

    setBuying(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  if (!listing) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/marketplace" className="text-accent hover:underline text-sm mt-2 block">← Back to Marketplace</Link>
      </div>
    );
  }

  const isFree = listing.is_free || listing.price === 0;
  const isOwn = user?.id === listing.seller_id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/marketplace" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left: Image */}
        <div className="md:col-span-3 space-y-4">
          <div className="rounded-xl overflow-hidden aspect-[4/3] bg-gradient-to-br from-accent/20 to-primary/10">
            {listing.cover_image ? (
              <img src={listing.cover_image} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-16 h-16 text-accent/30" />
              </div>
            )}
          </div>

          {listing.description && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold text-foreground text-sm mb-2">About this item</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>
          )}
        </div>

        {/* Right: Purchase panel */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 sticky top-4">
            <div className="space-y-1">
              <Badge variant="secondary" className="text-xs capitalize mb-2">{listing.category}</Badge>
              <h1 className="text-xl font-bold text-foreground">{listing.title}</h1>
              {listing.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {listing.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Tag className="w-2.5 h-2.5" />#{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Seller */}
            <Link to={`/profile/${listing.seller_id}`} className="flex items-center gap-2 group">
              <Avatar className="w-8 h-8">
                <AvatarImage src={listing.seller_avatar} />
                <AvatarFallback className="bg-accent/10 text-accent text-xs">{listing.seller_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Sold by</p>
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">{listing.seller_name}</p>
              </div>
            </Link>

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground text-sm">Price</span>
                <span className="text-2xl font-bold text-foreground">
                  {isFree ? <span className="text-green-600">Free</span> : `$${listing.price.toFixed(2)}`}
                </span>
              </div>

              {alreadyPurchased ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <Check className="w-4 h-4" /> Purchased
                  </div>
                  {purchasedOrder?.download_url && (
                    <a
                      href={purchasedOrder.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>
              ) : isOwn ? (
                <p className="text-sm text-muted-foreground text-center">This is your listing</p>
              ) : (
                <Button
                  onClick={handleBuy}
                  disabled={buying}
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                >
                  {buying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
                  ) : isFree ? (
                    <><Download className="w-4 h-4" /> Get for Free</>
                  ) : (
                    <><ShoppingCart className="w-4 h-4" /> Buy Now</>
                  )}
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center mt-3">
                Secure checkout · Instant download
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
              <Download className="w-3.5 h-3.5" />
              <span>{listing.sales_count || 0} sales</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}