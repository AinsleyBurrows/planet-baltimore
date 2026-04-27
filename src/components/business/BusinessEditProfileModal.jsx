import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import NeighborhoodSelect from '@/components/shared/NeighborhoodSelect';

const CATEGORIES = ['restaurant', 'retail', 'service', 'entertainment', 'health', 'education', 'technology', 'creative', 'nonprofit', 'other'];

export default function BusinessEditProfileModal({ business, onClose }) {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const hub = business.hub_data || {};
  const [form, setForm] = useState({
    name: business.name || '',
    description: business.description || '',
    category: business.category || 'other',
    address: business.address || '',
    phone: business.phone || '',
    website: business.website || '',
    hours: business.hours || '',
    neighborhood_id: business.neighborhood_id || '',
    neighborhood_name: business.neighborhood_name || '',
    tags: (business.tags || []).join(', '),
    // Restaurant
    reservation_url: business.reservation_url || '',
    order_online_url: business.order_online_url || '',
    // Retail
    shop_url: hub.shop_url || '',
    loyalty_info: hub.loyalty_info || '',
    // Service
    booking_url: hub.booking_url || '',
    insurance_info: hub.insurance_info || '',
    // Entertainment
    ticket_url: hub.ticket_url || '',
    capacity: hub.capacity || '',
    age_restriction: hub.age_restriction || '',
    dresscode: hub.dresscode || '',
    // Health
    telehealth_available: hub.telehealth_available || false,
    insurance_accepted: hub.insurance_accepted || false,
    // Creative
    commissions_open: hub.commissions_open || false,
    // Nonprofit
    donate_url: hub.donate_url || '',
    volunteer_signup_open: hub.volunteer_signup_open || false,
    mission: hub.mission || '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(business.image_url || '');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(business.banner_url || '');
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) { setBannerFile(file); setBannerPreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    setSaving(true);
    let image_url = business.image_url;
    let banner_url = business.banner_url;

    if (avatarFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: avatarFile });
      image_url = file_url;
    }
    if (bannerFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: bannerFile });
      banner_url = file_url;
    }

    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);

    const hub_data = {
      ...(business.hub_data || {}),
      // Retail
      shop_url: form.shop_url,
      loyalty_info: form.loyalty_info,
      // Service
      booking_url: form.booking_url,
      insurance_info: form.insurance_info,
      // Entertainment
      ticket_url: form.ticket_url,
      capacity: form.capacity,
      age_restriction: form.age_restriction,
      dresscode: form.dresscode,
      // Health
      telehealth_available: form.telehealth_available,
      insurance_accepted: form.insurance_accepted,
      // Creative
      commissions_open: form.commissions_open,
      // Nonprofit
      donate_url: form.donate_url,
      volunteer_signup_open: form.volunteer_signup_open,
      mission: form.mission,
    };

    await base44.entities.BusinessPage.update(business.id, {
      name: form.name,
      description: form.description,
      category: form.category,
      address: form.address,
      phone: form.phone,
      website: form.website,
      hours: form.hours,
      neighborhood_id: form.neighborhood_id,
      neighborhood_name: form.neighborhood_name,
      tags,
      reservation_url: form.reservation_url,
      order_online_url: form.order_online_url,
      image_url,
      banner_url,
      hub_data,
    });

    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
    setSaving(false);
    onClose();
  };

  const isRestaurant = form.category === 'restaurant';
  // kept for conditional rendering in UI

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-foreground">Edit Business Page</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Banner */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Banner Photo</label>
            <div
              className="relative h-28 rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors cursor-pointer flex items-center justify-center"
              onClick={() => bannerInputRef.current?.click()}
            >
              {bannerPreview
                ? <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                : <div className="text-center"><ImageIcon className="w-5 h-5 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Add banner photo</span></div>
              }
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                <Camera className="w-5 h-5 text-white opacity-0 hover:opacity-100" />
              </div>
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          </div>

          {/* Logo */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Logo / Profile Photo</label>
            <div className="flex items-center gap-3">
              <div
                className="w-16 h-16 rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 cursor-pointer flex items-center justify-center flex-shrink-0"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <Camera className="w-5 h-5 text-muted-foreground" />
                }
              </div>
              <button onClick={() => avatarInputRef.current?.click()} className="text-sm text-accent hover:underline">
                {avatarPreview ? 'Change logo' : 'Upload logo'}
              </button>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Basic Info */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Business Name *</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your business name" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tell people about your business…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Neighborhood</label>
              <NeighborhoodSelect
                value={form.neighborhood_id}
                onChange={(id, name) => setForm(p => ({ ...p, neighborhood_id: id, neighborhood_name: name }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="(410) 555-0100" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Website</label>
              <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://…" />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hours</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} placeholder="Mon-Fri 11am-10pm, Sat-Sun 10am-11pm" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</label>
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="seafood, outdoor seating, family-friendly" />
          </div>

          {/* Category-specific fields */}
          {isRestaurant && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Restaurant Settings</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Reservation Link (OpenTable, Resy, etc.)</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.reservation_url} onChange={e => setForm(p => ({ ...p, reservation_url: e.target.value }))} placeholder="https://resy.com/…" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Online Ordering Link</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.order_online_url} onChange={e => setForm(p => ({ ...p, order_online_url: e.target.value }))} placeholder="https://order.yourrestaurant.com" />
              </div>
            </div>
          )}

          {form.category === 'retail' && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Retail Settings</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Online Shop Link</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.shop_url} onChange={e => setForm(p => ({ ...p, shop_url: e.target.value }))} placeholder="https://shop.yourbusiness.com" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Loyalty / Rewards Program Info</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.loyalty_info} onChange={e => setForm(p => ({ ...p, loyalty_info: e.target.value }))} placeholder="e.g. Earn 1 point per $1 spent…" />
              </div>
            </div>
          )}

          {form.category === 'service' && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Service Settings</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Booking / Appointment Link</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.booking_url} onChange={e => setForm(p => ({ ...p, booking_url: e.target.value }))} placeholder="https://calendly.com/…" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Insurance / Payment Info</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.insurance_info} onChange={e => setForm(p => ({ ...p, insurance_info: e.target.value }))} placeholder="e.g. Accepts major credit cards, invoicing available" />
              </div>
            </div>
          )}

          {form.category === 'entertainment' && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Entertainment Settings</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ticketing Link</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.ticket_url} onChange={e => setForm(p => ({ ...p, ticket_url: e.target.value }))} placeholder="https://eventbrite.com/…" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Capacity</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="500" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Age Restriction</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.age_restriction} onChange={e => setForm(p => ({ ...p, age_restriction: e.target.value }))} placeholder="21+" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dress Code</label>
                  <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.dresscode} onChange={e => setForm(p => ({ ...p, dresscode: e.target.value }))} placeholder="Smart casual" />
                </div>
              </div>
            </div>
          )}

          {form.category === 'health' && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Health Settings</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Booking / Appointment Link</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.booking_url} onChange={e => setForm(p => ({ ...p, booking_url: e.target.value }))} placeholder="https://zocdoc.com/…" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.telehealth_available} onChange={e => setForm(p => ({ ...p, telehealth_available: e.target.checked }))} className="rounded" />
                  <span className="text-muted-foreground">Telehealth Available</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.insurance_accepted} onChange={e => setForm(p => ({ ...p, insurance_accepted: e.target.checked }))} className="rounded" />
                  <span className="text-muted-foreground">Insurance Accepted</span>
                </label>
              </div>
            </div>
          )}

          {form.category === 'creative' && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Creative Settings</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Shop / Purchase Link (Etsy, website, etc.)</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.shop_url} onChange={e => setForm(p => ({ ...p, shop_url: e.target.value }))} placeholder="https://etsy.com/shop/…" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.commissions_open} onChange={e => setForm(p => ({ ...p, commissions_open: e.target.checked }))} className="rounded" />
                <span className="text-muted-foreground">Commissions are currently open</span>
              </label>
            </div>
          )}

          {form.category === 'nonprofit' && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-secondary/20">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Nonprofit Settings</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mission Statement</label>
                <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} value={form.mission} onChange={e => setForm(p => ({ ...p, mission: e.target.value }))} placeholder="What does your organization do and who do you serve?" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Donation Link</label>
                <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={form.donate_url} onChange={e => setForm(p => ({ ...p, donate_url: e.target.value }))} placeholder="https://donate.yourorg.org" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.volunteer_signup_open} onChange={e => setForm(p => ({ ...p, volunteer_signup_open: e.target.checked }))} className="rounded" />
                <span className="text-muted-foreground">Accept volunteer sign-ups</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0">
          <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}