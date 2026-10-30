import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ShopProductCard from './shop/ShopProductCard';
import ShopProductForm from './shop/ShopProductForm';
import ShopBagPanel from './shop/ShopBagPanel';
import ShopCheckout from './shop/ShopCheckout';
import { money } from './shop/money';

const TYPE_LABELS = {
  merch: 'Merch',
  book: 'Books',
  vinyl: 'Records',
  print: 'Prints',
  original: 'Originals',
  collectable: 'Collectables',
  digital_download: 'Digital',
  other: 'More',
};

export default function BusinessShopTab({ business, isOwner, isPlatformAdmin, user }) {
  const queryClient = useQueryClient();
  const canManage = isOwner || isPlatformAdmin;
  const [bag, setBag] = useState([]);
  const [showBag, setShowBag] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('all');

  const { data: items = [] } = useQuery({
    queryKey: ['business-shop', business.id],
    queryFn: () => base44.entities.ShopItem.filter({ business_id: business.id }, 'sort_order', 100),
    enabled: !!business.id,
  });

  const types = useMemo(() => {
    const found = [...new Set(items.map((item) => item.item_type).filter(Boolean))];
    return ['all', ...found];
  }, [items]);

  const visible = type === 'all' ? items : items.filter((item) => item.item_type === type);
  const count = bag.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = bag.reduce((sum, line) => sum + (Number(line.item.price) || 0) * line.qty, 0);

  const addToBag = (item) =>
    setBag((prev) => {
      const existing = prev.find((line) => line.item.id === item.id);
      if (existing) {
        return prev.map((line) => (line.item.id === item.id ? { ...line, qty: line.qty + 1 } : line));
      }
      return [...prev, { item, qty: 1 }];
    });

  const changeQty = (id, delta) =>
    setBag((prev) => prev.map((line) => (line.item.id === id ? { ...line, qty: Math.max(1, line.qty + delta) } : line)));

  const removeLine = (id) => setBag((prev) => prev.filter((line) => line.item.id !== id));

  const deleteItem = async (item) => {
    if (!window.confirm(`Remove ${item.title} from the shop?`)) return;
    await base44.entities.ShopItem.delete(item.id);
    setBag((prev) => prev.filter((line) => line.item.id !== item.id));
    queryClient.invalidateQueries({ queryKey: ['business-shop', business.id] });
  };

  const startCheckout = () => {
    setShowBag(false);
    setShowCheckout(true);
  };

  return (
    <div className="pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-neutral-200 pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-500">Shop</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{business.name}</h2>
          <p className="mt-1 text-sm text-neutral-500">Free shipping. Pay by card at checkout.</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-neutral-300 px-4 text-xs font-semibold uppercase tracking-[0.1em] text-neutral-900 transition-colors hover:border-neutral-900"
          >
            <Plus className="h-3.5 w-3.5" /> Add product
          </button>
        )}
      </div>

      {types.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {types.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                type === value
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {value === 'all' ? 'All' : TYPE_LABELS[value] || value}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="mt-8 border border-dashed border-neutral-300 px-6 py-14 text-center">
          <ShoppingBag className="mx-auto h-6 w-6 text-neutral-400" />
          <p className="mt-2 text-sm text-neutral-600">
            {canManage ? 'Add your first product to open the shop.' : 'This shop has no products yet.'}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-4 h-10 rounded-full bg-neutral-900 px-5 text-xs font-semibold uppercase tracking-[0.1em] text-white hover:bg-neutral-700"
            >
              Add product
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-3">
          {visible.map((item) => (
            <ShopProductCard
              key={item.id}
              item={item}
              canManage={canManage}
              onAdd={addToBag}
              onDelete={deleteItem}
            />
          ))}
        </div>
      )}

      {count > 0 && !showCheckout && (
        <button
          type="button"
          onClick={() => setShowBag(true)}
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition-colors hover:bg-neutral-700 md:bottom-6"
        >
          <ShoppingBag className="h-4 w-4" />
          Bag · {count} · {money(subtotal)}
        </button>
      )}

      {showBag && (
        <ShopBagPanel
          lines={bag}
          subtotal={subtotal}
          onChangeQty={changeQty}
          onRemove={removeLine}
          onCheckout={startCheckout}
          onClose={() => setShowBag(false)}
        />
      )}

      {showCheckout && (
        <ShopCheckout
          business={business}
          lines={bag}
          subtotal={subtotal}
          user={user}
          onPaid={() => setBag([])}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {showForm && (
        <ShopProductForm
          business={business}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['business-shop', business.id] });
          }}
        />
      )}
    </div>
  );
}