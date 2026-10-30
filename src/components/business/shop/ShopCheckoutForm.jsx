import React, { useState } from 'react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CheckCircle2, Loader2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { money } from './money';

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#171717',
      fontFamily: 'Inter, Helvetica, Arial, sans-serif',
      letterSpacing: '0.02em',
      '::placeholder': { color: '#a3a3a3' },
    },
    invalid: { color: '#dc2626', iconColor: '#dc2626' },
  },
};

function Field({ label, value, onChange, placeholder, type = 'text', autoComplete }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1 w-full border-0 border-b border-neutral-300 bg-transparent pb-2 pt-1 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
      />
    </label>
  );
}

function CardRow({ label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">{label}</span>
      <div className="mt-1 border-b border-neutral-300 pb-2.5 pt-1">{children}</div>
    </label>
  );
}

export default function ShopCheckoutForm({ business, lines, subtotal, user, onClose, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [form, setForm] = useState({
    name: user?.full_name || '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  const [cardName, setCardName] = useState(user?.full_name || '');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (placing) return;
    setError('');
    if (!form.name || !form.address1 || !form.city || !form.state || !form.zip) {
      setError('Please complete your delivery address.');
      return;
    }
    if (!stripe || !elements) {
      setError('Payment is still loading. Please try again in a moment.');
      return;
    }
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setPlacing(true);
    try {
      const items = lines.map(({ item, qty }) => ({ id: item.id, quantity: qty }));
      const created = await base44.functions.invoke('createBusinessShopPayment', {
        businessId: business.id,
        items,
        shipping: form,
      });
      if (created.data?.error) throw new Error(created.data.error);

      const { error: cardError, paymentIntent } = await stripe.confirmCardPayment(created.data.clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: cardName || form.name,
            email: user?.email,
            phone: form.phone,
            address: {
              line1: form.address1,
              line2: form.address2,
              city: form.city,
              state: form.state,
              postal_code: form.zip,
              country: 'US',
            },
          },
        },
      });

      if (cardError) {
        setError(cardError.message || 'Your card could not be charged.');
        setPlacing(false);
        return;
      }
      if (paymentIntent?.status !== 'succeeded') {
        setError('Your payment could not be completed. Please try again.');
        setPlacing(false);
        return;
      }

      const confirmed = await base44.functions.invoke('confirmBusinessShopOrder', {
        orderId: created.data.orderId,
      });
      setOrder(
        confirmed.data?.order || {
          order_number: created.data.orderNumber,
          total: created.data.total,
          buyer_name: form.name,
          buyer_email: user?.email,
          shipping: form,
        },
      );
      onPaid?.();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (order) {
    return (
      <div className="mx-auto max-w-md py-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-neutral-900" strokeWidth={1.4} />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Order confirmed</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Thanks, {(order.buyer_name || user?.full_name || 'friend').split(' ')[0]}. A receipt is on its way to{' '}
          {order.buyer_email || user?.email}.
        </p>
        <div className="mt-6 border border-neutral-200 p-5 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500">
            Order {order.order_number}
          </p>
          <p className="mt-2 text-xl font-bold text-neutral-900">{money(order.total)}</p>
          <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-900">Delivering to</p>
            <p>{order.shipping?.name}</p>
            <p>
              {order.shipping?.address1}
              {order.shipping?.address2 ? `, ${order.shipping.address2}` : ''}
            </p>
            <p>
              {order.shipping?.city}, {order.shipping?.state} {order.shipping?.zip}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full rounded-full bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 md:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Delivery</h2>
          <div className="mt-4 space-y-4">
            <Field label="Full name" value={form.name} onChange={setField('name')} autoComplete="name" placeholder="Jordan Ellis" />
            <Field label="Street address" value={form.address1} onChange={setField('address1')} autoComplete="address-line1" placeholder="1200 N Charles St" />
            <Field label="Apartment, suite (optional)" value={form.address2} onChange={setField('address2')} autoComplete="address-line2" placeholder="Apt 4B" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" value={form.city} onChange={setField('city')} autoComplete="address-level2" placeholder="Baltimore" />
              <Field label="State" value={form.state} onChange={setField('state')} autoComplete="address-level1" placeholder="MD" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="ZIP code" value={form.zip} onChange={setField('zip')} autoComplete="postal-code" placeholder="21201" />
              <Field label="Phone" value={form.phone} onChange={setField('phone')} type="tel" autoComplete="tel" placeholder="410 555 0134" />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">Payment</h2>
          <div className="mt-4 space-y-4">
            <CardRow label="Card number">
              <CardNumberElement options={ELEMENT_OPTIONS} />
            </CardRow>
            <div className="grid grid-cols-2 gap-4">
              <CardRow label="Expiration">
                <CardExpiryElement options={ELEMENT_OPTIONS} />
              </CardRow>
              <CardRow label="Security code">
                <CardCvcElement options={ELEMENT_OPTIONS} />
              </CardRow>
            </div>
            <Field label="Name on card" value={cardName} onChange={(event) => setCardName(event.target.value)} autoComplete="cc-name" />
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-neutral-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            Card details go straight to Stripe. {business.name} and Planet Baltimore never see your card number.
          </p>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={placing}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-400 md:hidden"
          >
            {placing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing order…
              </>
            ) : (
              `Place order · ${money(subtotal)}`
            )}
          </button>
        </section>
      </div>

      <aside className="md:sticky md:top-24 md:self-start">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Summary</h2>
        <ul className="mt-4 space-y-3 border-b border-neutral-200 pb-4">
          {lines.map(({ item, qty }) => (
            <li key={item.id} className="flex items-center gap-3">
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden bg-neutral-100">
                {item.image_url && <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="text-xs text-neutral-500">Qty {qty}</p>
              </div>
              <p className="text-sm font-medium text-neutral-900">{money((Number(item.price) || 0) * qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-500">Subtotal</dt>
            <dd className="text-neutral-900">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-500">Shipping</dt>
            <dd className="text-neutral-900">Free</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
            <dt>Total</dt>
            <dd>{money(subtotal)}</dd>
          </div>
        </dl>
        <button
          type="submit"
          disabled={placing}
          className="mt-5 hidden h-12 w-full items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-400 md:flex"
        >
          {placing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing order…
            </>
          ) : (
            `Place order · ${money(subtotal)}`
          )}
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
          Free returns within 30 days. Orders ship within 3 to 5 business days.
        </p>
      </aside>
    </form>
  );
}