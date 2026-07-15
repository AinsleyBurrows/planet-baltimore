import React from 'react';
import { Image as ImageIcon, UtensilsCrossed } from 'lucide-react';

const ACCENT = '#d4580a';
const TYPE_LABELS = {
  food_truck: 'Food Truck',
  restaurant: 'Restaurant',
  bakery: 'Bakery',
  beverage: 'Beverage',
  dessert: 'Dessert',
  snack: 'Snack',
  farmers_market: "Farmers' Market",
  popup: 'Pop-Up',
  other: 'Other',
};

export default function FoodVendorCard({ vendor }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      {vendor.image_url ? (
        <div className="aspect-square w-full overflow-hidden bg-muted">
          <img src={vendor.image_url} alt={vendor.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square w-full bg-secondary flex items-center justify-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-foreground">{vendor.name}</h3>
        <span className="text-xs font-medium mt-0.5 inline-block" style={{ color: ACCENT }}>
          {TYPE_LABELS[vendor.vendor_type] || vendor.vendor_type}
        </span>
        {vendor.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{vendor.description}</p>
        )}
        {vendor.website && (
          <a
            href={vendor.website}
            target="_blank"
            rel="noreferrer"
            className="text-xs mt-3 inline-flex items-center gap-1 hover:underline"
            style={{ color: ACCENT }}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Menu / Website
          </a>
        )}
      </div>
    </div>
  );
}