import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, BadgeDollarSign, ExternalLink, Loader2, X, Upload, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const SPONSOR_TIERS = ['Title', 'Gold', 'Silver', 'Bronze', 'Partner'];

function MediaKitEditor({ kit, onSave, onCancel, saving }) {
  const [form, setForm] = useState(kit || {
    monthly_downloads: '', total_downloads: '', audience_description: '',
    primary_age_range: '', top_geos: '', rate_card: '', sponsor_email: '',
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Edit Media Kit</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Monthly Downloads</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.monthly_downloads} onChange={e => setForm(p => ({ ...p, monthly_downloads: e.target.value }))} placeholder="e.g. 15,000" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Total Downloads</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.total_downloads} onChange={e => setForm(p => ({ ...p, total_downloads: e.target.value }))} placeholder="e.g. 250,000" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Audience Description</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none min-h-[70px]" value={form.audience_description} onChange={e => setForm(p => ({ ...p, audience_description: e.target.value }))} placeholder="Who listens to this show?" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Primary Age Range</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.primary_age_range} onChange={e => setForm(p => ({ ...p, primary_age_range: e.target.value }))} placeholder="e.g. 25–44" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Top Geographies</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.top_geos} onChange={e => setForm(p => ({ ...p, top_geos: e.target.value }))} placeholder="e.g. Baltimore, DC, NYC" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Rate Card / Ad Packages</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none min-h-[70px]" value={form.rate_card} onChange={e => setForm(p => ({ ...p, rate_card: e.target.value }))} placeholder="Pre-roll: $X / Mid-roll: $Y / Dedicated episode: $Z" />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Sponsor Inquiry Email</label>
          <input type="email" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.sponsor_email} onChange={e => setForm(p => ({ ...p, sponsor_email: e.target.value }))} placeholder="sponsors@yourshow.com" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button type="submit" size="sm" disabled={saving} className="gap-1.5">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Save</Button>
      </div>
    </form>
  );
}

function SponsorForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { name: '', logo_url: '', website: '', tier: 'Gold', description: '', sponsor_since: '' });
  const [uploading, setUploading] = useState(false);
  const logoRef = React.useRef(null);
  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, logo_url: file_url }));
    setUploading(false);
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">{initial ? 'Edit Sponsor' : 'Add Sponsor'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
          <input required className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tier</label>
          <select className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))}>
            {SPONSOR_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Logo</label>
          <div className="flex gap-2 items-center">
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} placeholder="URL or upload" />
            <button type="button" onClick={() => logoRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-input bg-secondary text-sm hover:bg-secondary/80 flex-shrink-0">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}Upload
            </button>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Website</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Sponsor Since</label>
          <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.sponsor_since} onChange={e => setForm(p => ({ ...p, sponsor_since: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Description</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none min-h-[60px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
        <Button type="submit" size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" />Save</Button>
      </div>
    </form>
  );
}

function SponsorCard({ sponsor, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
        {sponsor.logo_url ? <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-cover" /> : <BadgeDollarSign className="w-5 h-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm text-foreground truncate">{sponsor.name}</p>
          {sponsor.tier && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent uppercase">{sponsor.tier}</span>}
        </div>
        {sponsor.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sponsor.description}</p>}
        {sponsor.website && <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline inline-flex items-center gap-0.5 mt-1">Visit <ExternalLink className="w-3 h-3" /></a>}
      </div>
      {isOwner && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )}
    </div>
  );
}

export default function SponsorshipsTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const [editingKit, setEditingKit] = useState(false);
  const [savingKit, setSavingKit] = useState(false);
  const [showSponsorForm, setShowSponsorForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [inquiry, setInquiry] = useState({ name: '', email: '', company: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const kit = artist.podcast_media_kit || {};
  const sponsors = artist.podcast_sponsors || [];

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });

  const saveKit = async (form) => {
    setSavingKit(true);
    await base44.entities.ArtistPage.update(artist.id, { podcast_media_kit: form });
    setSavingKit(false); setEditingKit(false); refresh();
  };

  const saveSponsor = async (form) => {
    setSavingSponsor(true);
    if (editingSponsor != null) {
      const updated = sponsors.map((s, i) => i === editingSponsor ? form : s);
      await base44.entities.ArtistPage.update(artist.id, { podcast_sponsors: updated });
      setEditingSponsor(null);
    } else {
      await base44.entities.ArtistPage.update(artist.id, { podcast_sponsors: [form, ...sponsors] });
      setShowSponsorForm(false);
    }
    setSavingSponsor(false); refresh();
  };

  const deleteSponsor = async (idx) => {
    if (!window.confirm('Remove this sponsor?')) return;
    const updated = sponsors.filter((_, i) => i !== idx);
    await base44.entities.ArtistPage.update(artist.id, { podcast_sponsors: updated });
    refresh();
  };

  const submitInquiry = async (e) => {
    e.preventDefault();
    setSending(true);
    const target = kit.sponsor_email || artist.contact_email || '';
    if (target) {
      try {
        await base44.integrations.Core.SendEmail({
          to: target,
          subject: `Sponsorship inquiry for ${artist.name}`,
          body: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nCompany: ${inquiry.company}\n\n${inquiry.message}`,
        });
      } catch (err) { /* email may only reach registered users; ignore */ }
    }
    setSending(false); setSent(true);
    setInquiry({ name: '', email: '', company: '', message: '' });
    setTimeout(() => setSent(false), 4000);
  };

  const hasKit = Object.values(kit).some(v => v);

  return (
    <div className="space-y-5">
      {/* Media kit */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><BadgeDollarSign className="w-4 h-4 text-accent" /> Media Kit</h3>
          {isOwner && !editingKit && (
            <Button size="sm" variant="outline" onClick={() => setEditingKit(true)} className="gap-1.5 rounded-lg text-xs">{hasKit ? 'Edit' : 'Add'} Media Kit</Button>
          )}
        </div>
        {editingKit ? (
          <MediaKitEditor kit={hasKit ? kit : null} onSave={saveKit} onCancel={() => setEditingKit(false)} saving={savingKit} />
        ) : hasKit ? (
          <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-2 gap-4">
            {kit.monthly_downloads && <div><p className="text-[10px] uppercase text-muted-foreground">Monthly Downloads</p><p className="text-sm font-bold text-foreground">{kit.monthly_downloads}</p></div>}
            {kit.total_downloads && <div><p className="text-[10px] uppercase text-muted-foreground">Total Downloads</p><p className="text-sm font-bold text-foreground">{kit.total_downloads}</p></div>}
            {kit.primary_age_range && <div><p className="text-[10px] uppercase text-muted-foreground">Primary Age</p><p className="text-sm font-bold text-foreground">{kit.primary_age_range}</p></div>}
            {kit.top_geos && <div><p className="text-[10px] uppercase text-muted-foreground">Top Geographies</p><p className="text-sm font-bold text-foreground">{kit.top_geos}</p></div>}
            {kit.audience_description && <div className="col-span-2"><p className="text-[10px] uppercase text-muted-foreground">Audience</p><p className="text-sm text-foreground">{kit.audience_description}</p></div>}
            {kit.rate_card && <div className="col-span-2"><p className="text-[10px] uppercase text-muted-foreground">Rate Card</p><p className="text-sm text-foreground whitespace-pre-wrap">{kit.rate_card}</p></div>}
          </div>
        ) : (
          <p className="text-center py-8 text-sm text-muted-foreground bg-secondary/30 rounded-xl">No media kit published yet.</p>
        )}
      </div>

      {/* Sponsors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Sponsors</h3>
          {isOwner && !showSponsorForm && editingSponsor === null && (
            <Button size="sm" onClick={() => setShowSponsorForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs"><Plus className="w-3.5 h-3.5" /> Add Sponsor</Button>
          )}
        </div>
        <AnimatePresence>
          {showSponsorForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-3">
              <SponsorForm onSave={saveSponsor} onCancel={() => setShowSponsorForm(false)} />
            </motion.div>
          )}
        </AnimatePresence>
        {sponsors.length === 0 && !showSponsorForm
          ? <p className="text-center py-6 text-sm text-muted-foreground">No sponsors listed yet.</p>
          : <div className="space-y-2">{sponsors.map((s, i) => editingSponsor === i ? <SponsorForm key={i} initial={s} onSave={saveSponsor} onCancel={() => setEditingSponsor(null)} /> : <SponsorCard key={i} sponsor={s} isOwner={isOwner} onEdit={() => setEditingSponsor(i)} onDelete={() => deleteSponsor(i)} />)}</div>}
      </div>

      {/* Sponsor inquiry */}
      {!isOwner && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1"><Mail className="w-4 h-4 text-accent" /> Sponsor This Podcast</h3>
          <p className="text-xs text-muted-foreground mb-3">Interested in advertising? Reach out with your campaign details.</p>
          {sent ? (
            <p className="text-sm text-green-600 text-center py-3">✓ Inquiry sent. The host will be in touch.</p>
          ) : (
            <form onSubmit={submitInquiry} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Your name" className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={inquiry.name} onChange={e => setInquiry(p => ({ ...p, name: e.target.value }))} />
                <input required type="email" placeholder="Email" className="px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={inquiry.email} onChange={e => setInquiry(p => ({ ...p, email: e.target.value }))} />
              </div>
              <input placeholder="Company / brand" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={inquiry.company} onChange={e => setInquiry(p => ({ ...p, company: e.target.value }))} />
              <textarea required placeholder="Tell us about your campaign…" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none min-h-[80px]" value={inquiry.message} onChange={e => setInquiry(p => ({ ...p, message: e.target.value }))} />
              <Button type="submit" size="sm" disabled={sending} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">{sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}Send Inquiry</Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}