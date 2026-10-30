import React, { useRef, useState } from 'react';
import { X, ImagePlus, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const TYPES = [
  { value: 'merch', label: 'Merchandise' },
  { value: 'book', label: 'Book' },
  { value: 'vinyl', label: 'Record' },
  { value: 'print', label: 'Print' },
  { value: 'original', label: 'Original work' },
  { value: 'collectable', label: 'Collectable' },
  { value: 'digital_download', label: 'Digital download' },
  { value: 'other', label: 'Other' },
];

const inputClass =
  'mt-1 w-full border-0 border-b border-neutral-300 bg-transparent pb-2 pt-1 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900';

const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500';

export default function ShopProductForm({ business, onClose, onSaved }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    title: '',
    price: '',
    item_type: 'merch',
    description: '',
    image_url: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((prev) => ({ ...prev, image_url: file_url }));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const save = async () => {
    const price = Number(form.price);
    if (!form.title.trim()) {
      setError('Add a product name.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Add a price greater than zero.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await base44.entities.ShopItem.create({
        business_id: business.id,
        title: form.title.trim(),
        price,
        item_type: form.item_type,
        description: form.description.trim(),
        image_url: form.image_url,
        status: 'available',
        sort_order: 0,
      });
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Could not save this product.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full overflow-y-auto bg-white p-6 sm:max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Shop</p>
            <h3 className="text-xl font-bold tracking-tight text-neutral-900">New product</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-neutral-100">
            <X className="h-4 w-4 text-neutral-700" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-5 flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-neutral-100 transition-colors hover:bg-neutral-200"
        >
          {form.image_url ? (
            <img src={form.image_url} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
          ) : (
            <span className="flex flex-col items-center gap-1.5 text-neutral-500">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">Add product photo</span>
            </span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className={labelClass}>Product name</span>
            <input className={inputClass} value={form.title} onChange={set('title')} placeholder="House blend 12 oz" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={labelClass}>Price (USD)</span>
              <input className={inputClass} value={form.price} onChange={set('price')} inputMode="decimal" placeholder="18.00" />
            </label>
            <label className="block">
              <span className={labelClass}>Type</span>
              <select className={`${inputClass} cursor-pointer`} value={form.item_type} onChange={set('item_type')}>
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.description}
              onChange={set('description')}
              placeholder="What buyers should know"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving || uploading}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-300"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to shop'}
        </button>
      </div>
    </div>
  );
}