import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Palette, ExternalLink, ShoppingBag, Mail, Megaphone, Image as ImageIcon, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppImage from '@/components/shared/AppImage';
import EventCard from '@/components/shared/EventCard';

function AddPortfolioModal({ business, onClose, onSaved }) {
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    setSaving(true);
    const urls = await Promise.all(files.map(async f => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      return { title, description, image_url: file_url };
    }));
    setItems(prev => [...prev, ...urls]);
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const portfolio = [...(business.hub_data?.portfolio || []), ...items];
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), portfolio } });
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Portfolio Work</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Description / medium (optional)" value={description} onChange={e => setDescription(e.target.value)} />
        <label className="block cursor-pointer">
          <div className="h-24 rounded-xl bg-secondary/50 border-2 border-dashed border-border hover:border-accent/50 transition-colors flex items-center justify-center gap-2">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{saving ? 'Uploading…' : 'Upload images'}</span>
          </div>
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={saving} />
        </label>
        {items.length > 0 && (
          <div className="grid grid-cols-3 gap-1">
            {items.map((item, i) => <img key={i} src={item.image_url} alt="" className="aspect-square object-cover rounded-lg" />)}
          </div>
        )}
        <Button onClick={handleSave} disabled={items.length === 0 || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : `Add ${items.length} Work${items.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}

function CommissionInquiryForm({ business }) {
  const [form, setForm] = useState({ name: '', email: '', type: '', description: '', budget: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.name || !form.email || !form.description) return;
    setSending(true);
    const contactEmail = business.hub_data?.contact_email || business.contact_email;
    if (contactEmail) {
      await base44.integrations.Core.SendEmail({
        to: contactEmail,
        subject: `Commission Inquiry from ${form.name} — ${business.name}`,
        body: `Name: ${form.name}\nEmail: ${form.email}\nType: ${form.type}\nBudget: ${form.budget}\n\n${form.description}`,
      });
    }
    setSending(false); setSent(true);
  };

  if (sent) return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Mail className="w-5 h-5 text-green-600" /></div>
      <p className="font-semibold text-foreground">Inquiry Sent!</p>
      <p className="text-sm text-muted-foreground">We'll be in touch soon.</p>
    </div>
  );

  return (
    <div className="space-y-3 p-4 bg-secondary/30 rounded-xl border border-border">
      <h3 className="font-semibold text-foreground flex items-center gap-2"><Mail className="w-4 h-4 text-accent" /> Commission Inquiry</h3>
      <div className="grid grid-cols-2 gap-2">
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Your name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Type (portrait, logo…)" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Budget (optional)" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={3} placeholder="Describe what you're looking for… *" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      <Button onClick={handleSend} disabled={!form.name || !form.email || !form.description || sending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
        {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</> : <>Send Inquiry</>}
      </Button>
    </div>
  );
}

function AnnounceModal({ business, user, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };
  const handlePost = async () => {
    setSaving(true);
    let mediaUrls = [];
    if (imageFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: imageFile });
      mediaUrls = [file_url];
    }
    await base44.entities.Post.create({
      author_id: user.id, author_name: business.name, author_avatar: business.image_url,
      author_type: 'business', page_id: business.id, page_type: 'business',
      content, media_urls: mediaUrls, media_type: mediaUrls.length ? 'image' : 'text',
      post_type: 'announcement', visibility: 'public',
      neighborhood_id: business.neighborhood_id, neighborhood_name: business.neighborhood_name,
    });
    setSaving(false); onSaved();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Share Work / Update</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
          placeholder={`Share new work, a process update, or news from ${business.name}…`}
          value={content} onChange={e => setContent(e.target.value)} />
        {imagePreview && <img src={imagePreview} alt="" className="w-full h-36 object-cover rounded-xl" />}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <ImageIcon className="w-4 h-4" /> Attach image
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
        <Button onClick={handlePost} disabled={!content || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : <><Megaphone className="w-4 h-4" />Post Update</>}
        </Button>
      </div>
    </div>
  );
}

export default function CreativeHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [showInquiry, setShowInquiry] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    queryClient.invalidateQueries({ queryKey: ['business-posts'] });
    setShowAdd(false); setShowAnnounce(false);
  };

  const deletePortfolioItem = async (item) => {
    if (!window.confirm('Remove this work?')) return;
    const portfolio = (business.hub_data?.portfolio || []).filter(p => p.image_url !== item.image_url);
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), portfolio } });
    refresh();
  };

  const portfolio = business.hub_data?.portfolio || [];
  const shopUrl = business.hub_data?.shop_url;
  const commissionsOpen = business.hub_data?.commissions_open;
  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setShowAnnounce(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <Megaphone className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Share Work / Update</span>
          </button>
          <button onClick={() => setShowAdd(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Add to Portfolio</span>
          </button>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {shopUrl && (
          <a href={shopUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
            <ShoppingBag className="w-4 h-4" /> Shop / Buy Work
          </a>
        )}
        {commissionsOpen && (
          <button onClick={() => setShowInquiry(v => !v)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Mail className="w-4 h-4" /> {showInquiry ? 'Close Inquiry' : 'Commissions Open'}
          </button>
        )}
      </div>

      {showInquiry && !isOwner && <CommissionInquiryForm business={business} />}

      {/* Portfolio Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><Palette className="w-4 h-4 text-accent" /> Portfolio</h2>
          {isOwner && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>
        {portfolio.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">
            {isOwner ? 'Add your portfolio work here.' : 'No portfolio work shared yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {portfolio.map((item, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden">
                <AppImage src={item.image_url} className="w-full aspect-square" aspectRatio="square" />
                {(item.title || item.description) && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100">
                    {item.title && <p className="text-white text-xs font-semibold">{item.title}</p>}
                    {item.description && <p className="text-white/80 text-xs line-clamp-1">{item.description}</p>}
                  </div>
                )}
                {isOwner && (
                  <button onClick={() => deletePortfolioItem(item)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-destructive opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Palette className="w-4 h-4 text-accent" /> Shows & Exhibitions</h2>
          <div className="space-y-3">{upcomingEvents.slice(0, 3).map(e => <EventCard key={e.id} event={e} compact />)}</div>
        </div>
      )}

      {showAdd && <AddPortfolioModal business={business} onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {showAnnounce && user && <AnnounceModal business={business} user={user} onClose={() => setShowAnnounce(false)} onSaved={refresh} />}
    </div>
  );
}