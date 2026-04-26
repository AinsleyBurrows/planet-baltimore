import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Tag, ExternalLink, Megaphone, Plus, Trash2, X, Loader2, Image as ImageIcon, Gift, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EventCard from '@/components/shared/EventCard';

function ProductCard({ product, isOwner, onDelete }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-card group">
      {product.image_url && <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover" />}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{product.name}</p>
            {product.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            {product.price && <Badge variant="secondary" className="text-xs">{product.price}</Badge>}
            {product.on_sale && <Badge className="text-xs bg-red-500/10 text-red-600 border-0">Sale</Badge>}
          </div>
        </div>
        {product.shop_url && (
          <a href={product.shop_url} target="_blank" rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-xs text-accent hover:underline font-medium">
            <ExternalLink className="w-3 h-3" /> Shop Now
          </a>
        )}
      </div>
      {isOwner && (
        <button onClick={() => onDelete(product)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-destructive opacity-0 group-hover:opacity-100 transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AddProductModal({ business, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', shop_url: '', on_sale: false, image_url: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true);
    let imageUrl = form.image_url;
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      imageUrl = file_url;
    }
    const products = [...(business.hub_data?.products || []), { ...form, image_url: imageUrl }];
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), products } });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Featured Product</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <label className="block cursor-pointer">
          <div className="h-28 rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
            {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> :
              <div className="text-center"><ImageIcon className="w-5 h-5 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Product photo (optional)</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Product name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Description…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Price (e.g. $24.99)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Shop/buy link (optional)" value={form.shop_url} onChange={e => setForm(p => ({ ...p, shop_url: e.target.value }))} />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.on_sale} onChange={e => setForm(p => ({ ...p, on_sale: e.target.checked }))} className="rounded" />
          <span className="text-muted-foreground">Mark as on sale</span>
        </label>
        <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Product'}
        </Button>
      </div>
    </div>
  );
}

function AnnounceModal({ business, user, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const handlePost = async () => {
    setSaving(true);
    await base44.entities.Post.create({
      author_id: user.id, author_name: business.name, author_avatar: business.image_url,
      author_type: 'business', page_id: business.id, page_type: 'business',
      content, post_type: 'announcement', visibility: 'public',
      neighborhood_id: business.neighborhood_id, neighborhood_name: business.neighborhood_name,
    });
    setSaving(false); onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Post Announcement</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
          placeholder={`New sale, product drop, or store update at ${business.name}…`}
          value={content} onChange={e => setContent(e.target.value)} />
        <Button onClick={handlePost} disabled={!content || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : <><Megaphone className="w-4 h-4" />Post Update</>}
        </Button>
      </div>
    </div>
  );
}

export default function RetailHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    setShowAdd(false); setShowAnnounce(false);
  };

  const deleteProduct = async (product) => {
    if (!window.confirm('Remove this product?')) return;
    const products = (business.hub_data?.products || []).filter(p => p.name !== product.name);
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), products } });
    refresh();
  };

  const products = business.hub_data?.products || [];
  const shopUrl = business.hub_data?.shop_url || business.website;
  const loyaltyInfo = business.hub_data?.loyalty_info;
  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowAnnounce(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <Megaphone className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Post Update</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <ShoppingBag className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Add Product</span>
          </button>
        </div>
      )}

      {shopUrl && (
        <a href={shopUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
          <ShoppingBag className="w-4 h-4" /> Shop Online
        </a>
      )}

      {loyaltyInfo && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <Gift className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">Loyalty Program</p>
            <p className="text-xs text-yellow-700 mt-0.5">{loyaltyInfo}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Star className="w-4 h-4 text-accent" /> Featured Products</h2>
        </div>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">
            {isOwner ? 'Showcase your products here.' : 'No featured products yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p, i) => <ProductCard key={i} product={p} isOwner={isOwner} onDelete={deleteProduct} />)}
          </div>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Tag className="w-4 h-4 text-accent" /> Sales & Events</h2>
          <div className="space-y-3">{upcomingEvents.slice(0, 3).map(e => <EventCard key={e.id} event={e} compact />)}</div>
        </div>
      )}

      {showAdd && <AddProductModal business={business} onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {showAnnounce && user && <AnnounceModal business={business} user={user} onClose={() => setShowAnnounce(false)} onSaved={refresh} />}
    </div>
  );
}