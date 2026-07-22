import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { FESTIVAL_CATEGORIES, FESTIVAL_NEIGHBORHOODS } from '@/data/festivals';
import { ArrowLeft, Plus, Trash2, Loader2, Save, Upload, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import FestivalTicketTypeManager from '@/components/festivals/FestivalTicketTypeManager';
import HeadlinerEditor from '@/components/festivals/HeadlinerEditor';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/* ---------- small reusable editors ---------- */
function Card({ title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function StringArray({ label, items, onChange, placeholder }) {
  const [text, setText] = useState((items || []).join('\n'));
  useEffect(() => setText((items || []).join('\n')), [items]);
  const commit = () => onChange(text.split('\n').map((s) => s.trim()).filter(Boolean));
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} rows={3} placeholder={placeholder} />
      <p className="text-xs text-muted-foreground">One per line.</p>
    </div>
  );
}

const FIELDS_RENDER = {
  text: (val, set, ph) => <Input value={val || ''} onChange={(e) => set(e.target.value)} placeholder={ph} />,
  textarea: (val, set, ph) => <Textarea value={val || ''} onChange={(e) => set(e.target.value)} rows={2} placeholder={ph} />,
  date: (val, set) => <Input type="date" value={val || ''} onChange={(e) => set(e.target.value)} />,
  number: (val, set) => <Input type="number" step="any" value={val ?? ''} onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))} />,
  boolean: (val, set) => <Switch checked={!!val} onCheckedChange={set} />,
  list: (val, set, ph) => <Input value={Array.isArray(val) ? val.join(', ') : ''} onChange={(e) => set(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder={ph} />,
  select: (val, set, _ph, opts) => (
    <Select value={val || ''} onValueChange={set}>
      <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
      <SelectContent>{(opts || []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  ),
  imageurl: (val, set) => (
    <div className="space-y-1.5">
      <Input value={val || ''} onChange={(e) => set(e.target.value)} placeholder="https://…" />
      <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-[#d4580a] font-medium hover:underline">
        <Upload className="w-3.5 h-3.5" /> Upload image
        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try { const { file_url } = await base44.integrations.Core.UploadFile({ file }); set(file_url); } catch { /* ignore */ }
        }} />
      </label>
      {val && <img src={val} alt="" className="w-16 h-16 rounded-lg object-cover" />}
    </div>
  ),
};

function ItemArray({ label, items, onChange, fields, addLabel }) {
  const list = Array.isArray(items) ? items : [];
  const update = (i, k, v) => onChange(list.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, {}]);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <button type="button" onClick={add} className="text-xs flex items-center gap-1 text-[#d4580a] font-medium hover:underline"><Plus className="w-3.5 h-3.5" />{addLabel || 'Add'}</button>
      </div>
      {list.length === 0 && <p className="text-xs text-muted-foreground">No entries yet.</p>}
      {list.map((it, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2 relative">
          <button type="button" onClick={() => remove(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-7">
            {fields.map((f) => (
              <div key={f.k} className="space-y-1">
                <span className="text-xs text-muted-foreground">{f.l}</span>
                {FIELDS_RENDER[f.t](it[f.k], (v) => update(i, f.k, v), f.ph, f.opts)}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CAT_OPTS = ['arts', 'music', 'food', 'film', 'literature', 'poetry', 'dance', 'theater', 'cultural', 'caribbean', 'african_diaspora', 'latino', 'asian', 'pride', 'family', 'wellness', 'holiday', 'neighborhood', 'market'];
const DISCIPLINE_OPTS = ['music', 'dance', 'poetry', 'film', 'theater', 'visual_art', 'fashion', 'photography', 'other'];
const SCHED_CAT_OPTS = ['music', 'poetry', 'film', 'dance', 'theater', 'family', 'community', 'arts', 'cultural'];

const SCHEDULE_FIELDS = [
  { k: 'day', l: 'Day', t: 'date' },
  { k: 'time', l: 'Time', t: 'text', ph: '2:00 PM' },
  { k: 'title', l: 'Title', t: 'text' },
  { k: 'artist', l: 'Artist', t: 'text' },
  { k: 'stage', l: 'Stage', t: 'text' },
  { k: 'category', l: 'Category', t: 'select', opts: SCHED_CAT_OPTS },
  { k: 'description', l: 'Description', t: 'textarea' },
];
const ARTIST_FIELDS = [
  { k: 'name', l: 'Name', t: 'text' },
  { k: 'image', l: 'Photo', t: 'imageurl' },
  { k: 'discipline', l: 'Discipline', t: 'select', opts: DISCIPLINE_OPTS },
  { k: 'day', l: 'Day', t: 'date' },
  { k: 'time', l: 'Time', t: 'text' },
  { k: 'stage', l: 'Stage', t: 'text' },
  { k: 'bio', l: 'Bio', t: 'textarea' },
  { k: 'profile_id', l: 'Profile ID', t: 'text' },
];
const VENDOR_FIELDS = [
  { k: 'name', l: 'Name', t: 'text' },
  { k: 'category', l: 'Category', t: 'text' },
  { k: 'booth', l: 'Booth', t: 'text' },
  { k: 'description', l: 'Description', t: 'textarea' },
  { k: 'website', l: 'Website', t: 'text' },
];
const FOOD_FIELDS = [
  { k: 'name', l: 'Name', t: 'text' },
  { k: 'cuisine', l: 'Cuisine', t: 'text' },
  { k: 'menu_highlights', l: 'Menu (comma separated)', t: 'list' },
  { k: 'price_range', l: 'Price range', t: 'text', ph: '$$' },
  { k: 'booth', l: 'Booth', t: 'text' },
  { k: 'dietary', l: 'Dietary (comma separated)', t: 'list' },
  { k: 'alcohol', l: 'Alcohol', t: 'boolean' },
];
const EXPERIENCE_FIELDS = [
  { k: 'title', l: 'Title', t: 'text' },
  { k: 'image', l: 'Image', t: 'imageurl' },
  { k: 'day', l: 'Date', t: 'date' },
  { k: 'time', l: 'Time', t: 'text', ph: '2:00 PM' },
  { k: 'venue', l: 'Venue / Location', t: 'text' },
  { k: 'price', l: 'Price', t: 'text', ph: 'Free / $10 / $5–$15' },
  { k: 'description', l: 'Description', t: 'textarea' },
];
const FAQ_FIELDS = [
  { k: 'q', l: 'Question', t: 'text' },
  { k: 'a', l: 'Answer', t: 'textarea' },
];
const UPDATE_FIELDS = [
  { k: 'timestamp', l: 'Timestamp', t: 'text', ph: '2026-07-21 09:00' },
  { k: 'type', l: 'Type', t: 'text', ph: 'Schedule / Emergency' },
  { k: 'message', l: 'Message', t: 'textarea' },
];
const GARAGE_FIELDS = [
  { k: 'name', l: 'Name', t: 'text' },
  { k: 'cost', l: 'Cost', t: 'text' },
];

export default function EditFestival() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();

  const [record, setRecord] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authorized, setAuthorized] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const recs = await base44.entities.Festival.filter({ slug });
        if (cancelled || !recs.length) { setLoading(false); return; }
        const rec = recs[0];
        setRecord(rec);
        setForm({ ...rec });
        const isOwner = user && (user.id === (rec.owner_id || rec.created_by_id));
        if (!isOwner && user?.role !== 'admin') setAuthorized(false);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, user]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const setNested = (objKey, k, v) => setForm((p) => ({ ...p, [objKey]: { ...(p[objKey] || {}), [k]: v } }));

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('image_url', file_url);
    } catch {
      toast({ title: 'Image upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (val) => setForm((p) => ({
    ...p,
    categories: (p.categories || []).includes(val)
      ? p.categories.filter((c) => c !== val)
      : [...(p.categories || []), val],
  }));

  const handleSave = async () => {
    if (!record) return;
    try {
      setSaving(true);
      const { id, created_date, updated_date, created_by_id, ...payload } = form;
      await base44.entities.Festival.update(record.id, payload);
      toast({ title: 'Festival updated' });
      navigate(`/festivals/${slug}`);
    } catch (err) {
      toast({ title: 'Update failed', description: err?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record) return;
    if (!window.confirm('Delete this festival permanently? This cannot be undone.')) return;
    try {
      setSaving(true);
      await base44.entities.Festival.delete(record.id);
      toast({ title: 'Festival deleted' });
      navigate('/festivals');
    } catch (err) {
      toast({ title: 'Delete failed', description: err?.message, variant: 'destructive' });
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><div className="w-7 h-7 border-2 border-muted border-t-[#d4580a] rounded-full animate-spin" /></div>;
  }
  if (!record || !form) {
    return <div className="text-center py-16"><h3 className="font-semibold mb-1">Festival not found</h3><Link to="/festivals" className="text-sm text-[#d4580a] hover:underline">Back to Festivals</Link></div>;
  }
  if (!authorized) {
    return (
      <div className="text-center py-16 space-y-2">
        <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto" />
        <h3 className="font-semibold">You don’t have permission to edit this festival</h3>
        <Link to={`/festivals/${slug}`} className="text-sm text-[#d4580a] hover:underline">Back to festival</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"><ArrowLeft className="w-5 h-5" /></button>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Edit Festival</h1>
        <p className="text-sm text-muted-foreground mt-1">Update every part of your festival page. Changes go live immediately.</p>
      </div>

      {/* Basics */}
      <Card title="Festival Basics">
        <div className="space-y-1.5"><Label>Name</Label><Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Short description</Label><Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
        <div className="space-y-1.5"><Label>About the festival</Label><Textarea value={form.long_description || ''} onChange={(e) => set('long_description', e.target.value)} rows={4} /></div>
        <div className="space-y-1.5">
          <Label>Festival image</Label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-4 cursor-pointer hover:bg-secondary text-sm text-muted-foreground">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {form.image_url ? 'Change image' : 'Upload image'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </label>
            {form.image_url && <img src={form.image_url} alt="preview" className="w-16 h-16 rounded-lg object-cover" />}
          </div>
        </div>
        <div className="space-y-1.5"><Label>Status badges (comma separated)</Label>
          <Input value={(form.status_badges || []).join(', ')} onChange={(e) => set('status_badges', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} placeholder="Free, Outdoor, Family Friendly" />
        </div>
      </Card>

      {/* Date & Location */}
      <Card title="Date & Location">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Start date</Label><Input type="date" value={form.start_date || ''} onChange={(e) => set('start_date', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End date</Label><Input type="date" value={form.end_date || ''} onChange={(e) => set('end_date', e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Hours</Label><Input value={form.hours || ''} onChange={(e) => set('hours', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Venue</Label><Input value={form.venue || ''} onChange={(e) => set('venue', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Neighborhood</Label>
          <Select value={form.neighborhood || ''} onValueChange={(v) => set('neighborhood', v)}>
            <SelectTrigger><SelectValue placeholder="Select a neighborhood" /></SelectTrigger>
            <SelectContent>{FESTIVAL_NEIGHBORHOODS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label>Footprint</Label><Input value={form.footprint || ''} onChange={(e) => set('footprint', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Latitude</Label><Input type="number" step="any" value={form.coordinates_lat ?? ''} onChange={(e) => set('coordinates_lat', e.target.value === '' ? null : Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Longitude</Label><Input type="number" step="any" value={form.coordinates_lng ?? ''} onChange={(e) => set('coordinates_lng', e.target.value === '' ? null : Number(e.target.value))} /></div>
        </div>
      </Card>

      {/* Categories & Audience */}
      <Card title="Categories & Audience">
        <div className="space-y-1.5"><Label>Categories</Label>
          <div className="flex flex-wrap gap-1.5">
            {FESTIVAL_CATEGORIES.map((c) => {
              const active = (form.categories || []).includes(c.value);
              return <button key={c.value} type="button" onClick={() => toggleCategory(c.value)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? 'bg-[#d4580a] text-white border-[#d4580a]' : 'border-border text-muted-foreground hover:bg-secondary'}`}>{c.label}</button>;
            })}
          </div>
        </div>
        <StringArray label="Tags" items={form.tags} onChange={(v) => set('tags', v)} placeholder="Music, Family" />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Format</Label><Input value={form.format || ''} onChange={(e) => set('format', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Audience</Label>
            <Select value={form.audience || 'All Ages'} onValueChange={(v) => set('audience', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All Ages">All Ages</SelectItem>
                <SelectItem value="Family Friendly">Family Friendly</SelectItem>
                <SelectItem value="21+">21+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Expected attendance</Label><Input value={form.expected_attendance || ''} onChange={(e) => set('expected_attendance', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Age restriction</Label><Input value={form.age_restriction || ''} onChange={(e) => set('age_restriction', e.target.value)} /></div>
        </div>
        <div className="space-y-1.5"><Label>Pet policy</Label><Input value={form.pet_policy || ''} onChange={(e) => set('pet_policy', e.target.value)} /></div>
        <div className="flex items-center justify-between"><Label htmlFor="ros">Rain or shine</Label><Switch id="ros" checked={form.rain_or_shine !== false} onCheckedChange={(v) => set('rain_or_shine', v)} /></div>
        <div className="flex items-center justify-between"><Label htmlFor="feat">Featured</Label><Switch id="feat" checked={!!form.featured} onCheckedChange={(v) => set('featured', v)} /></div>
      </Card>

      {/* Admission */}
      <Card title="Admission">
        <div className="space-y-1.5"><Label>Admission type</Label>
          <Select value={form.admission_type || 'free'} onValueChange={(v) => set('admission_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid / Ticketed</SelectItem>
              <SelectItem value="donation">Donation-based</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.admission_type !== 'free' && <div className="space-y-1.5"><Label>Price label</Label><Input value={form.admission_price || ''} onChange={(e) => set('admission_price', e.target.value)} /></div>}
        <div className="space-y-1.5"><Label>Ticket / registration link</Label><Input value={form.admission_url || ''} onChange={(e) => set('admission_url', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Status</Label>
          <Select value={form.status || 'published'} onValueChange={(v) => set('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FestivalTicketTypeManager festivalId={record.id} />
      </Card>

      {/* Organizer & Social */}
      <Card title="Organizer & Social">
        <div className="space-y-1.5"><Label>Organizer name</Label><Input value={form.organizer_name || ''} onChange={(e) => set('organizer_name', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Organizer description</Label><Textarea value={form.organizer_description || ''} onChange={(e) => set('organizer_description', e.target.value)} rows={2} /></div>
        <div className="space-y-1.5"><Label>Organizer website</Label><Input value={form.organizer_website || ''} onChange={(e) => set('organizer_website', e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Festival website</Label><Input value={form.social?.website || form.website || ''} onChange={(e) => setNested('social', 'website', e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Instagram</Label><Input value={form.social?.instagram || ''} onChange={(e) => setNested('social', 'instagram', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Facebook</Label><Input value={form.social?.facebook || ''} onChange={(e) => setNested('social', 'facebook', e.target.value)} /></div>
        </div>
      </Card>

      {/* Schedule */}
      <Card title="Schedule">
        <ItemArray label="Schedule items" items={form.schedule} onChange={(v) => set('schedule', v)} fields={SCHEDULE_FIELDS} addLabel="Add schedule item" />
      </Card>

      {/* Artists */}
      <Card title="Artists / Lineup">
        <ItemArray label="Artists" items={form.artists} onChange={(v) => set('artists', v)} fields={ARTIST_FIELDS} addLabel="Add artist" />
      </Card>

      {/* Vendors */}
      <Card title="Vendors">
        <ItemArray label="Vendors" items={form.vendors} onChange={(v) => set('vendors', v)} fields={VENDOR_FIELDS} addLabel="Add vendor" />
      </Card>

      {/* Food */}
      <Card title="Food + Drink">
        <ItemArray label="Food vendors" items={form.food_vendors} onChange={(v) => set('food_vendors', v)} fields={FOOD_FIELDS} addLabel="Add food vendor" />
      </Card>

      {/* Experiences */}
      <Card title="Featured Experiences">
        <ItemArray label="Experiences" items={form.experiences} onChange={(v) => set('experiences', v)} fields={EXPERIENCE_FIELDS} addLabel="Add experience" />
      </Card>

      {/* Highlights */}
      <Card title="Highlights">
        <HeadlinerEditor items={form.highlights?.headliners} onChange={(v) => setNested('highlights', 'headliners', v)} />
        <StringArray label="Installations" items={form.highlights?.installations} onChange={(v) => setNested('highlights', 'installations', v)} />
        <StringArray label="Performances" items={form.highlights?.performances} onChange={(v) => setNested('highlights', 'performances', v)} />
        <StringArray label="Family" items={form.highlights?.family} onChange={(v) => setNested('highlights', 'family', v)} />
        <StringArray label="Food" items={form.highlights?.food} onChange={(v) => setNested('highlights', 'food', v)} />
      </Card>

      {/* Gallery */}
      <Card title="Gallery">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg border border-dashed border-border hover:bg-secondary text-sm text-muted-foreground">
            <Upload className="w-4 h-4" /> Upload image
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try { setUploading(true); const { file_url } = await base44.integrations.Core.UploadFile({ file }); set('gallery_photos', [...(form.gallery_photos || []), file_url]); }
              catch { /* ignore */ } finally { setUploading(false); }
            }} />
          </label>
          {uploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <StringArray label="Or paste URLs (one per line)" items={form.gallery_photos} onChange={(v) => set('gallery_photos', v)} placeholder="https://…" />
        {(form.gallery_photos || []).length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {form.gallery_photos.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                <button type="button" onClick={() => set('gallery_photos', form.gallery_photos.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* FAQ */}
      <Card title="FAQ">
        <ItemArray label="Questions" items={form.faq} onChange={(v) => set('faq', v)} fields={FAQ_FIELDS} addLabel="Add question" />
      </Card>

      {/* Updates */}
      <Card title="Updates / Announcements">
        <ItemArray label="Updates" items={form.updates} onChange={(v) => set('updates', v)} fields={UPDATE_FIELDS} addLabel="Add update" />
      </Card>

      {/* Transportation */}
      <Card title="Getting There">
        {['lightRail', 'metro', 'bus', 'rideshare', 'bikeParking', 'walking'].map((k) => (
          <div key={k} className="space-y-1.5">
            <Label>{k.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}</Label>
            <Input value={form.transportation?.[k] || ''} onChange={(e) => setNested('transportation', k, e.target.value)} />
          </div>
        ))}
      </Card>

      {/* Parking */}
      <Card title="Parking">
        <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.parking?.notes || ''} onChange={(e) => setNested('parking', 'notes', e.target.value)} rows={2} /></div>
        <ItemArray label="Garages" items={form.parking?.garages} onChange={(v) => setNested('parking', 'garages', v)} fields={GARAGE_FIELDS} addLabel="Add garage" />
      </Card>

      {/* Rules */}
      <Card title="Festival Rules">
        {['bags', 'chairs', 'outsideFood', 'alcohol', 'smoking', 'pets', 'reentry', 'children', 'photography'].map((k) => (
          <div key={k} className="space-y-1.5">
            <Label>{k.replace(/([A-Z])/g, ' $1').replace(/^\w/, (c) => c.toUpperCase())}</Label>
            <Input value={form.rules?.[k] || ''} onChange={(e) => setNested('rules', k, e.target.value)} />
          </div>
        ))}
      </Card>

      {/* Accessibility */}
      <Card title="Accessibility">
        <div className="grid grid-cols-2 gap-3">
          {[['wheelchair', 'Wheelchair accessible'], ['asl', 'ASL interpretation'], ['restrooms', 'Accessible restrooms'], ['seating', 'Accessible seating'], ['sensoryFriendly', 'Sensory friendly'], ['transit', 'Transit accessible']].map(([k, label]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">{label}</span>
              <Switch checked={!!form.accessibility?.[k]} onCheckedChange={(v) => setNested('accessibility', k, v)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="button" onClick={handleSave} disabled={saving} className="text-white" style={{ backgroundColor: '#d4580a' }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
        </Button>
        <Link to={`/festivals/${slug}`} className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
        <Button type="button" onClick={handleDelete} variant="destructive" className="ml-auto">
          <Trash2 className="w-4 h-4" />Delete Festival
        </Button>
      </div>
    </div>
  );
}