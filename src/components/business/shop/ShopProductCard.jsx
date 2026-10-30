import React from 'react';
import { Trash2 } from 'lucide-react';
import { money } from './money';

export default function ShopProductCard({ item, canManage, onAdd, onDelete }) {
  const price = Number(item.price) || 0;
  const soldOut = item.status === 'sold_out';
  const buyable = !soldOut && price > 0;

  return (
    <div className="group">
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-[11px] uppercase tracking-[0.2em] text-neutral-400">
            {item.title}
          </div>
        )}
        {soldOut && (
          <span className="absolute left-3 top-3 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-900">
            Sold out
          </span>
        )}
        {canManage && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`Remove ${item.title}`}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-neutral-700 opacity-0 shadow-sm transition-opacity hover:text-red-600 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="pt-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold leading-snug text-neutral-900">{item.title}</p>
          <p className="whitespace-nowrap text-[15px] font-semibold text-neutral-900">
            {price > 0 ? money(price) : '—'}
          </p>
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-neutral-500">{item.description}</p>
        )}
        <button
          type="button"
          disabled={!buyable}
          onClick={() => onAdd(item)}
          className="mt-3 h-10 w-full rounded-full bg-neutral-900 text-[13px] font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          {soldOut ? 'Sold out' : price > 0 ? 'Add to bag' : 'Inquire in store'}
        </button>
      </div>
    </div>
  );
}