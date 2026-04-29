import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, HandHeart, Users, X, Loader2, Target, Mail, Megaphone, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BusinessPostsFeed from '@/components/business/BusinessPostsFeed';
import EventCard from '@/components/shared/EventCard';

function VolunteerSignupForm({ business }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', availability: '', skills: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.name || !form.email) return;
    setSending(true);
    const contactEmail = business.hub_data?.contact_email || business.contact_email;
    if (contactEmail) {
      await base44.integrations.Core.SendEmail({
        to: contactEmail,
        subject: `Volunteer Application — ${form.name}`,
        body: `Volunteer Inquiry for ${business.name}\n\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nAvailability: ${form.availability}\nSkills/Interests: ${form.skills}`,
      });
    }
    setSending(false); setSent(true);
  };

  if (sent) return (
    <div className="flex flex-col items-center gap-2 py-6 text-center bg-green-50 border border-green-200 rounded-xl">
      <Heart className="w-8 h-8 text-green-600" />
      <p className="font-semibold text-green-800">Thank you for signing up!</p>
      <p className="text-sm text-green-700">We'll reach out soon with next steps.</p>
    </div>
  );

  return (
    <div className="space-y-3 p-4 bg-secondary/30 rounded-xl border border-border">
      <h3 className="font-semibold text-foreground flex items-center gap-2"><HandHeart className="w-4 h-4 text-accent" /> Volunteer Sign-Up</h3>
      <div className="grid grid-cols-2 gap-2">
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Full name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Email *" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Phone (optional)" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Availability (e.g. weekends)" value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-card text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" rows={2} placeholder="Skills or interests you'd like to contribute…" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} />
      <Button onClick={handleSend} disabled={!form.name || !form.email || sending} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
        {sending ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <>Sign Up to Volunteer</>}
      </Button>
    </div>
  );
}

function ImpactItem({ item, isOwner, onDelete }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card group">
      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Target className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg text-accent leading-none">{item.metric}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
      </div>
      {isOwner && (
        <button onClick={() => onDelete(item)} className="p-1 rounded hover:bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function AddImpactModal({ business, onClose, onSaved }) {
  const [metric, setMetric] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const impact = [...(business.hub_data?.impact || []), { metric, label }];
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), impact } });
    setSaving(false); onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Add Impact Metric</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder='Metric (e.g. "1,200" or "85%")' value={metric} onChange={e => setMetric(e.target.value)} />
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring" placeholder='Label (e.g. "families served this year")' value={label} onChange={e => setLabel(e.target.value)} />
        <Button onClick={handleSave} disabled={!metric || !label || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : 'Add Metric'}
        </Button>
      </div>
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
          <h3 className="font-semibold">Post Update</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[100px]"
          placeholder={`Share impact stories, program updates, or calls to action from ${business.name}…`}
          value={content} onChange={e => setContent(e.target.value)} />
        {imagePreview && <img src={imagePreview} alt="" className="w-full h-36 object-cover rounded-xl" />}
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <ImageIcon className="w-4 h-4" /> Add photo
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
        </label>
        <Button onClick={handlePost} disabled={!content || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Posting…</> : <><Megaphone className="w-4 h-4" />Post Update</>}
        </Button>
      </div>
    </div>
  );
}

export default function NonprofitHub({ business, isOwner, user, events = [] }) {
  const queryClient = useQueryClient();
  const [showImpact, setShowImpact] = useState(false);
  const [showVolunteer, setShowVolunteer] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['business', business.id] });
    setShowImpact(false);
  };

  const deleteImpact = async (item) => {
    const impact = (business.hub_data?.impact || []).filter(i => i.metric !== item.metric || i.label !== item.label);
    await base44.entities.BusinessPage.update(business.id, { hub_data: { ...(business.hub_data || {}), impact } });
    refresh();
  };

  const donateUrl = business.hub_data?.donate_url;
  const volunteerSignupOpen = business.hub_data?.volunteer_signup_open;
  const mission = business.hub_data?.mission || business.description;
  const impact = business.hub_data?.impact || [];
  const upcomingEvents = events.filter(e => e.date && new Date(e.date) > new Date());

  return (
    <div className="space-y-6">
      {isOwner && (
        <div className="grid grid-cols-1 gap-3">
          <button onClick={() => setShowImpact(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 transition-all group">
            <Target className="w-6 h-6 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-accent">Add Impact Metric</span>
          </button>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex gap-3 flex-wrap">
        {donateUrl && (
          <a href={donateUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors">
            <Heart className="w-4 h-4" /> Donate Now
          </a>
        )}
        {volunteerSignupOpen && (
          <button onClick={() => setShowVolunteer(v => !v)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <HandHeart className="w-4 h-4" /> {showVolunteer ? 'Close' : 'Volunteer'}
          </button>
        )}
      </div>

      {showVolunteer && !isOwner && <VolunteerSignupForm business={business} />}

      {/* Mission */}
      {mission && (
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-accent" /> Our Mission</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{mission}</p>
        </div>
      )}

      {/* Impact */}
      {(impact.length > 0 || isOwner) && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2"><Target className="w-4 h-4 text-accent" /> Our Impact</h2>
            {isOwner && (
              <button onClick={() => setShowImpact(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">+ Add</button>
            )}
          </div>
          {impact.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center bg-secondary/30 rounded-xl">Add impact metrics to show your community what you've accomplished.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {impact.map((item, i) => <ImpactItem key={i} item={item} isOwner={isOwner} onDelete={deleteImpact} />)}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-accent" /> Programs & Events</h2>
          <div className="space-y-3">{upcomingEvents.slice(0, 4).map(e => <EventCard key={e.id} event={e} compact />)}</div>
        </div>
      )}

      <BusinessPostsFeed business={business} isOwner={isOwner} user={user} />

      {showImpact && <AddImpactModal business={business} onClose={() => setShowImpact(false)} onSaved={refresh} />}
    </div>
  );
}