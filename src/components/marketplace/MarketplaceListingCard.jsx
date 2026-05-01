import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MarketplaceListingCard({ listing }) {
  return (
    <Link
      to={`/marketplace/${listing.id}`}
      className="block bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Cover image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-accent/20 to-primary/10 overflow-hidden">
        {listing.cover_image ? (
          <img src={listing.cover_image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart className="w-10 h-10 text-accent/40" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="bg-black/50 text-white border-0 backdrop-blur-sm text-xs capitalize">
            {listing.category}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          {listing.is_free || listing.price === 0 ? (
            <Badge className="bg-green-500 text-white border-0 text-xs">Free</Badge>
          ) : (
            <Badge className="bg-accent text-accent-foreground border-0 text-xs font-bold">${listing.price.toFixed(2)}</Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-accent transition-colors">
          {listing.title}
        </h3>
        {listing.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{listing.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5">
              <AvatarImage src={listing.seller_avatar} />
              <AvatarFallback className="text-[9px] bg-accent/10 text-accent">{listing.seller_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">{listing.seller_name}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Download className="w-3 h-3" />
            <span>{listing.sales_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}