import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Pencil, Trash2, ShoppingBag, Tag, ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = ['print', 'original', 'merch', 'digital', 'music', 'apparel', 'accessory', 'other'];

function ProductForm({ artistPageId, ownerId, product, onSave, onClose }) {
  const [form, setForm] = useState(product || {
    title: '', description: '', price: '', category: 'other', stock: '', is_active: true,
  });
  const [images, setImages] = useState(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    const urls = await Promise.all(files.map(f => base44.integrations.Core.UploadFile({ file: f }).then(r => r.file_url)));
    setImages(prev => [...prev, ...urls]);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      artist_page_id: artistPageId,
      owner_id: ownerId,
      title: form.title,
      description: form.description,
      price: parseFloat(form.price) || 0,
      category: form.category,
      stock: form.stock === '' || form.stock === null ? null : parseInt(form.stock),
      is_active: form.is_active,
      images,
    };
    if (product?.id) {
      await base44.entities.ArtistProduct.update(product.id, data);
    } else {
      await base44.entities.ArtistProduct.create(data);
    }
    onSave();
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground">{product ? 'Edit Product' : 'Add Product'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Title *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Product name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="Describe your product..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price (USD) *</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock (blank = unlimited)</label>
              <input
                type="number"
                min="0"
                value={form.stock ?? ''}
                onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="∞"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Images</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm text-foreground">Active (visible to buyers)</label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (product ? 'Save Changes' : 'Add Product')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductCard({ product, isOwner, onEdit, onDelete, onBuy, buyingId }) {
  const isBuying = buyingId === product.id;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col group hover:shadow-md transition-all">
      <div className="aspect-square bg-secondary relative overflow-hidden">
        {product.images?.length ? (
          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        {!product.is_active && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-black/70 text-white border-0 text-xs">Sold Out</Badge>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="font-semibold text-foreground text-sm line-clamp-1">{product.title}</p>
        {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
        <div className="flex items-center gap-1.5 mt-1">
          <Badge variant="outline" className="text-[10px] capitalize">{product.category}</Badge>
          {product.stock !== null && product.stock !== undefined && (
            <span className="text-[10px] text-muted-foreground">{product.stock} left</span>
          )}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-bold text-foreground">${product.price.toFixed(2)}</span>
          {isOwner ? (
            <div className="flex gap-1">
              <button onClick={() => onEdit(product)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(product.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs h-7 px-3"
              onClick={() => onBuy(product)}
              disabled={isBuying || product.stock === 0 || !product.is_active}
            >
              {isBuying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Buy'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtistShopTab({ artistPageId, ownerId, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [buyingId, setBuyingId] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['artist-products', artistPageId],
    queryFn: () => base44.entities.ArtistProduct.filter({ artist_page_id: artistPageId }, 'sort_order', 100),
    enabled: !!artistPageId,
  });

  const visibleProducts = isOwner ? products : products.filter(p => p.is_active);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await base44.entities.ArtistProduct.delete(id);
    queryClient.invalidateQueries({ queryKey: ['artist-products', artistPageId] });
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['artist-products', artistPageId] });
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleBuy = async (product) => {
    setBuyingId(product.id);
    const res = await base44.functions.invoke('createArtistProductCheckout', { productId: product.id, quantity: 1 });
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      alert(res.data?.error || 'Could not start checkout. Please try again.');
    }
    setBuyingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-accent" />
          <h2 className="font-bold text-foreground">Shop</h2>
          {visibleProducts.length > 0 && (
            <Badge variant="secondary" className="text-xs">{visibleProducts.length} items</Badge>
          )}
        </div>
        {isOwner && (
          <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5" onClick={() => { setEditingProduct(null); setShowForm(true); }}>
            <Plus className="w-4 h-4" />Add Item
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="bg-secondary rounded-xl aspect-square animate-pulse" />)}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{isOwner ? 'No products yet. Add your first item!' : 'No items for sale right now.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {visibleProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              isOwner={isOwner}
              onEdit={prod => { setEditingProduct(prod); setShowForm(true); }}
              onDelete={handleDelete}
              onBuy={handleBuy}
              buyingId={buyingId}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          artistPageId={artistPageId}
          ownerId={ownerId}
          product={editingProduct}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}