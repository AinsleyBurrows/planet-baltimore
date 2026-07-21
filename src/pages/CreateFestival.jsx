import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { FESTIVAL_CATEGORIES, FESTIVAL_NEIGHBORHOODS } from '@/data/festivals';
import { slugify } from '@/lib/festivalShape';
import { ArrowLeft, Upload, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const ADMISSION_TYPES = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid / Ticketed' },
  { value: 'donation', label: 'Donation-based' },
];

export default function CreateFestival() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    long_description: '',
    image_url: '',
    start_date: '',
    end_date: '',
    hours: '',
    venue: '',
    neighborhood: '',
    footprint: '',
    categories: [],
    admission_type: 'free',
    admission_price: '',
    admission_url: '',
    organizer_name: '',
    organizer_description: '',
    organizer_website: '',
    website: '',
    coordinates_lat: '',
    coordinates_lng: '',
    format: 'Festival',
    audience: 'All Ages',
    age_restriction: '',
    pet_policy: '',
    expected_attendance: '',
    tags: '',
    rain_or_shine: true,
    status: 'published',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleCategory = (val) => setForm((p) => ({
    ...p,
    categories: p.categories.includes(val)
      ? p.categories.filter((c) => c !== val)
      : [...p.categories, val],
  }));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Festival name is required', variant: 'destructive' });
      return;
    }
    if (!form.start_date) {
      toast({ title: 'Start date is required', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const user = await base44.auth.me().catch(() => null);
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const slug = `${slugify(form.name)}-${Date.now().toString(36).slice(-4)}`;
      const payload = {
        ...form,
        slug,
        tags,
        owner_id: user?.id || '',
        coordinates_lat: form.coordinates_lat ? Number(form.coordinates_lat) : null,
        coordinates_lng: form.coordinates_lng ? Number(form.coordinates_lng) : null,
        end_date: form.end_date || form.start_date,
        age_restriction: form.age_restriction || (form.audience === '21+' ? '21+ only' : 'All ages'),
        pet_policy: form.pet_policy || 'Service animals welcome. Check organizer policy for pets.',
      };
      const created = await base44.entities.Festival.create(payload);
      toast({ title: 'Festival created!', description: 'Your festival is now live.' });
      navigate(`/festivals/${slug}`);
      return created;
    } catch (err) {
      toast({ title: 'Could not create festival', description: err?.message || 'Try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#d4580a]" />Create a Festival
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your festival on Planet Baltimore. You can add the full schedule, artists, vendors, and more from the festival profile after publishing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basics */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Festival Basics</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Festival name *</Label>
            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Baltimore Jazz Festival" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Short description</Label>
            <Textarea id="description" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="One or two sentences shown on the festival card and hero." rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="long_description">About the festival</Label>
            <Textarea id="long_description" value={form.long_description} onChange={(e) => set('long_description', e.target.value)} placeholder="Longer description for the Overview tab." rows={4} />
          </div>

          <div className="space-y-1.5">
            <Label>Festival image</Label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-4 cursor-pointer hover:bg-secondary transition-colors text-sm text-muted-foreground">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {form.image_url ? 'Change image' : 'Upload image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
              {form.image_url && <img src={form.image_url} alt="preview" className="w-16 h-16 rounded-lg object-cover" />}
            </div>
          </div>
        </div>

        {/* Date & location */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Date & Location</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start_date">Start date *</Label>
              <Input id="start_date" type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hours">Hours</Label>
            <Input id="hours" value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="e.g. Sat 11am–8pm" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="e.g. Patterson Park" />
          </div>

          <div className="space-y-1.5">
            <Label>Neighborhood</Label>
            <Select value={form.neighborhood} onValueChange={(v) => set('neighborhood', v)}>
              <SelectTrigger><SelectValue placeholder="Select a neighborhood" /></SelectTrigger>
              <SelectContent>
                {FESTIVAL_NEIGHBORHOODS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" step="any" value={form.coordinates_lat} onChange={(e) => set('coordinates_lat', e.target.value)} placeholder="39.30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude</Label>
              <Input id="lng" type="number" step="any" value={form.coordinates_lng} onChange={(e) => set('coordinates_lng', e.target.value)} placeholder="-76.61" />
            </div>
          </div>
        </div>

        {/* Categories & audience */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Categories & Audience</h2>

          <div className="space-y-1.5">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-1.5">
              {FESTIVAL_CATEGORIES.map((c) => {
                const active = form.categories.includes(c.value);
                return (
                  <button key={c.value} type="button" onClick={() => toggleCategory(c.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${active ? 'bg-[#d4580a] text-white border-[#d4580a]' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="e.g. Music, Family, Outdoor" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="format">Format</Label>
              <Input id="format" value={form.format} onChange={(e) => set('format', e.target.value)} placeholder="e.g. Street Festival" />
            </div>
            <div className="space-y-1.5">
              <Label>Audience</Label>
              <Select value={form.audience} onValueChange={(v) => set('audience', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Ages">All Ages</SelectItem>
                  <SelectItem value="Family Friendly">Family Friendly</SelectItem>
                  <SelectItem value="21+">21+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Admission */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Admission</h2>

          <div className="space-y-1.5">
            <Label>Admission type</Label>
            <Select value={form.admission_type} onValueChange={(v) => set('admission_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADMISSION_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.admission_type !== 'free' && (
            <div className="space-y-1.5">
              <Label htmlFor="admission_price">Price label</Label>
              <Input id="admission_price" value={form.admission_price} onChange={(e) => set('admission_price', e.target.value)} placeholder="e.g. $45–$75" />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="admission_url">Ticket / registration link</Label>
            <Input id="admission_url" value={form.admission_url} onChange={(e) => set('admission_url', e.target.value)} placeholder="https://…" />
          </div>
        </div>

        {/* Organizer */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Organizer</h2>

          <div className="space-y-1.5">
            <Label htmlFor="organizer_name">Organizer name</Label>
            <Input id="organizer_name" value={form.organizer_name} onChange={(e) => set('organizer_name', e.target.value)} placeholder="e.g. Your organization" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="organizer_description">Organizer description</Label>
            <Textarea id="organizer_description" value={form.organizer_description} onChange={(e) => set('organizer_description', e.target.value)} rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="organizer_website">Organizer website</Label>
            <Input id="organizer_website" value={form.organizer_website} onChange={(e) => set('organizer_website', e.target.value)} placeholder="https://…" />
          </div>
        </div>

        {/* Extra details */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Extra Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="website">Festival website</Label>
            <Input id="website" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="expected_attendance">Expected attendance</Label>
              <Input id="expected_attendance" value={form.expected_attendance} onChange={(e) => set('expected_attendance', e.target.value)} placeholder="e.g. 5,000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="age_restriction">Age restriction</Label>
              <Input id="age_restriction" value={form.age_restriction} onChange={(e) => set('age_restriction', e.target.value)} placeholder="e.g. All ages" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pet_policy">Pet policy</Label>
            <Input id="pet_policy" value={form.pet_policy} onChange={(e) => set('pet_policy', e.target.value)} placeholder="e.g. Leashed pets welcome" />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="rain">Rain or shine</Label>
            <Switch id="rain" checked={form.rain_or_shine} onCheckedChange={(v) => set('rain_or_shine', v)} />
          </div>

          <div className="space-y-1.5">
            <Label>Publish status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published (visible publicly)</SelectItem>
                <SelectItem value="draft">Draft (hidden from directory)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting || uploading} className="text-white" style={{ backgroundColor: '#d4580a' }}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {form.status === 'draft' ? 'Save Draft' : 'Create & Publish Festival'}
          </Button>
          <Link to="/festivals" className="text-sm text-muted-foreground hover:text-foreground">Cancel</Link>
        </div>
      </form>
    </div>
  );
}