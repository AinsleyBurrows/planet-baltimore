import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { money } from './money';

export default function ShopBagPanel({ lines, subtotal, onChangeQty, onRemove, onCheckout, onClose }) {
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-900">Bag ({count})</p>
          <button type="button" onClick={onClose} aria-label="Close bag" className="rounded-full p-2 hover:bg-neutral-100">
            <X className="h-5 w-5 text-neutral-700" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <ShoppingBag className="h-6 w-6 text-neutral-400" />
              <p className="text-sm text-neutral-500">Your bag is empty.</p>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {lines.map(({ item, qty }) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden bg-neutral-100">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
                      <p className="whitespace-nowrap text-sm font-semibold text-neutral-900">
                        {money((Number(item.price) || 0) * qty)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-neutral-300">
                        <button
                          type="button"
                          onClick={() => onChangeQty(item.id, -1)}
                          aria-label="Decrease quantity"
                          className="p-1.5 text-neutral-600 hover:text-neutral-900"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm text-neutral-900">{qty}</span>
                        <button
                          type="button"
                          onClick={() => onChangeQty(item.id, 1)}
                          aria-label="Increase quantity"
                          className="p-1.5 text-neutral-600 hover:text-neutral-900"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="text-xs text-neutral-500 underline hover:text-neutral-900"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-neutral-200 px-5 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-semibold text-neutral-900">{money(subtotal)}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">Shipping is free. Taxes calculated at checkout.</p>
          <button
            type="button"
            disabled={lines.length === 0}
            onClick={onCheckout}
            className="mt-4 h-12 w-full rounded-full bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            Checkout
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 h-10 w-full text-xs font-medium uppercase tracking-[0.15em] text-neutral-500 hover:text-neutral-900"
          >
            Continue shopping
          </button>
        </div>
      </div>
    </div>
  );
}