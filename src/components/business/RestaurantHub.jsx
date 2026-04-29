import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Utensils, Star, CalendarDays, Plus, Trash2,
  ShoppingBag, X, Loader2, ChevronDown, ChevronUp, Image as ImageIcon
} from 'lucide-react';
import BusinessPostsFeed from '@/components/business/BusinessPostsFeed';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import EventCard from '@/components/shared/EventCard';

// ─── Today's Specials ────────────────────────────────────────────────────────

function SpecialCard({ special, isOwner, onDelete }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-card group">
      {special.image_url && (
        <img src={special.image_url} alt={special.name} className="w-full h-36 object-cover" />
      )}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm text-foreground">{special.name}</p>
            {special.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{special.description}</p>}
          </div>
          {special.price && <Badge variant="secondary" className="text-xs flex-shrink-0">{special.price}</Badge>}
        </div>
      </div>
      {isOwner && (
        <button
          onClick={() => onDelete(special)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-destructive opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AddSpecialModal({ business, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', image_url: '' });
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
    const newSpecial = { ...form, image_url: imageUrl };
    const updated = [...(business.todays_specials || []), newSpecial];
    await base44.entities.BusinessPage.update(business.id, { todays_specials: updated });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Add Today's Special</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <label className="block cursor-pointer">
          <div className="h-28 rounded-xl overflow-hidden bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center">
            {imagePreview ? <img src={imagePreview} alt="" className="w-full h-full object-cover" /> :
              <div className="text-center"><ImageIcon className="w-5 h-5 mx-auto text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Add photo (optional)</span></div>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Special name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Description…" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Price (e.g. $14.99)" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
        <Button onClick={handleSave} disabled={!form.name || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Special'}
        </Button>
      </div>
    </div>
  );
}

// ─── Menu ────────────────────────────────────────────────────────────────────

function MenuSection({ section, idx, isOwner, onDeleteItem, onDeleteSection }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <span className="font-semibold text-sm text-foreground">{section.section_name}</span>
        <div className="flex items-center gap-2">
          {isOwner && (
            <span onClick={e => { e.stopPropagation(); onDeleteSection(idx); }} className="p-1 rounded hover:bg-destructive/10 text-destructive">
              <Trash2 className="w-3.5 h-3.5" />
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="divide-y divide-border">
          {(section.items || []).map((item, iIdx) => (
            <div key={iIdx} className="flex items-center justify-between px-3 py-2.5 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                {item.description && <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {item.price && <span className="text-sm font-semibold text-foreground">{item.price}</span>}
                {isOwner && (
                  <button onClick={() => onDeleteItem(idx, iIdx)} className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {(section.items || []).length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No items yet.</p>}
        </div>
      )}
    </div>
  );
}

function AddMenuItemModal({ business, onClose, onSaved }) {
  const [sectionName, setSectionName] = useState('');
  const [useExisting, setUseExisting] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const sections = business.menu_sections || [];
  const targetSection = useExisting || sectionName;

  const handleSave = async () => {
    if (!targetSection || !itemName) return;
    setSaving(true);
    const newItem = { name: itemName, description: itemDesc, price: itemPrice };
    let updatedSections = [...sections];
    const existingIdx = updatedSections.findIndex(s => s.section_name === targetSection);
    if (existingIdx >= 0) {
      updatedSections[existingIdx] = { ...updatedSections[existingIdx], items: [...(updatedSections[existingIdx].items || []), newItem] };
    } else {
      updatedSections.push({ section_name: targetSection, items: [newItem] });
    }
    await base44.entities.BusinessPage.update(business.id, { menu_sections: updatedSections });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Add Menu Item</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Section</label>
          {sections.length > 0 && (
            <select className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-ring" value={useExisting} onChange={e => { setUseExisting(e.target.value); setSectionName(''); }}>
              <option value="">+ New section</option>
              {sections.map(s => <option key={s.section_name} value={s.section_name}>{s.section_name}</option>)}
            </select>
          )}
          {!useExisting && (
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Section name (e.g. Appetizers)" value={sectionName} onChange={e => setSectionName(e.target.value)} />
          )}
        </div>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Item name *" value={itemName} onChange={e => setItemName(e.target.value)} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Description (optional)" value={itemDesc} onChange={e => setItemDesc(e.target.value)} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Price (e.g. $12.00)" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
        <Button onClick={handleSave} disabled={!targetSection || !itemName || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add to Menu'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main RestaurantHub ──────────────────────────────────────────────────────

export default function RestaurantHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();
  const [showAddSpecial, setShowAddSpecial] = useState(false);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    setShowAddSpecial(false);
    setShowAddMenuItem(false);
  };

  const deleteSpecial = async (special) => {
    if (!window.confirm('Remove this special?')) return;
    const updated = (business.todays_specials || []).filter(s => s.name !== special.name || s.description !== special.description);
    await base44.entities.BusinessPage.update(business.id, { todays_specials: updated });
    refresh();
  };

  const deleteMenuItem = async (sectionIdx, itemIdx) => {
    if (!window.confirm('Remove this item?')) return;
    const sections = [...(business.menu_sections || [])];
    sections[sectionIdx] = { ...sections[sectionIdx], items: sections[sectionIdx].items.filter((_, i) => i !== itemIdx) };
    await base44.entities.BusinessPage.update(business.id, { menu_sections: sections });
    refresh();
  };

  const deleteSection = async (sectionIdx) => {
    if (!window.confirm('Delete this entire section?')) return;
    const sections = (business.menu_sections || []).filter((_, i) => i !== sectionIdx);
    await base44.entities.BusinessPage.update(business.id, { menu_sections: sections });
    refresh();
  };

  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());

  return (
    <div className="space-y-6">

      {/* Quick Actions for Owner */}
      {isOwner && (
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => setShowAddSpecial(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <Star className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Add Today's Special</span>
          </button>
        </div>
      )}

      {/* Online Ordering / Reservations */}
      {(business.reservation_url || business.order_online_url) && (
        <div className="flex gap-3">
          {business.reservation_url && (
            <a href={business.reservation_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <CalendarDays className="w-4 h-4" /> Reserve a Table
            </a>
          )}
          {business.order_online_url && (
            <a href={business.order_online_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
              <ShoppingBag className="w-4 h-4" /> Order Online
            </a>
          )}
        </div>
      )}

      {/* Today's Specials */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Star className="w-4 h-4 text-accent" /> Today's Specials</h2>
        </div>
        {(business.todays_specials || []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">
            {isOwner ? 'No specials today. Add one above!' : 'No specials posted today.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(business.todays_specials || []).map((special, i) => (
              <SpecialCard key={i} special={special} isOwner={isOwner} onDelete={deleteSpecial} />
            ))}
          </div>
        )}
      </div>

      {/* Menu */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Utensils className="w-4 h-4 text-accent" /> Menu</h2>
          {isOwner && (
            <button onClick={() => setShowAddMenuItem(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          )}
        </div>
        {(business.menu_sections || []).length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">
            {isOwner ? 'No menu added yet. Click "Add Item" to start building your menu.' : 'Menu coming soon.'}
          </p>
        ) : (
          <div className="space-y-3">
            {(business.menu_sections || []).map((section, idx) => (
              <MenuSection key={idx} section={section} idx={idx} isOwner={isOwner} onDeleteItem={deleteMenuItem} onDeleteSection={deleteSection} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><CalendarDays className="w-4 h-4 text-accent" /> Upcoming Events</h2>
          <div className="space-y-3">
            {upcomingEvents.slice(0, 3).map(e => <EventCard key={e.id} event={e} compact />)}
          </div>
        </div>
      )}

      {/* Posts / Updates Feed */}
      <BusinessPostsFeed business={business} isOwner={isOwner} user={user} />

      {/* Modals */}
      {showAddSpecial && <AddSpecialModal business={business} onClose={() => setShowAddSpecial(false)} onSaved={refresh} />}
      {showAddMenuItem && <AddMenuItemModal business={business} onClose={() => setShowAddMenuItem(false)} onSaved={refresh} />}
    </div>
  );
}