import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NeighborhoodSelect from '@/components/shared/NeighborhoodSelect';

const AGENCY_TYPES = [
  { value: 'mayor_office', label: "Mayor's Office" },
  { value: 'city_council', label: 'City Council' },
  { value: 'department', label: 'Department' },
  { value: 'commission', label: 'Commission' },
  { value: 'agency', label: 'Agency' },
  { value: 'office', label: 'Office' },
  { value: 'court', label: 'Court' },
  { value: 'other', label: 'Other' },
];

export default function CreateGovernmentAgency() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', tagline: '', description: '', agency_type: 'department',
    website: '', phone: '', contact_email: '', address: '', hours: '',
    mission: '', jurisdiction_area: '', neighborhood_id: '', neighborhood_name: '',
  });

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const submit = async () => {
    if (!form.name.trim() || !user) return;
    setSaving(true);
    try {
      const created = await base44.entities.GovernmentAgency.create({ ...form, owner_id: user.id });
      navigate(`/government-agencies/${created.id}`);
    } catch (e) {
      alert(e?.message || 'Failed to create agency');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back</button>

      <div className="flex items-center gap-2">
        <Building2 className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Create Government Agency Page</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Agency Name *</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="e.g. Baltimore Department of Public Works" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Type</label>
            <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.agency_type} onChange={e => setForm(f => ({ ...f, agency_type: e.target.value }))}>
              {AGENCY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Neighborhood</label>
            <NeighborhoodSelect value={form.neighborhood_id} onChange={(n) => setForm(f => ({ ...f, neighborhood_id: n?.id || '', neighborhood_name: n?.name || '' }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Tagline</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Short tagline" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-24" placeholder="What does this agency do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Mission</label>
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Mission statement" value={form.mission} onChange={e => setForm(f => ({ ...f, mission: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Jurisdiction / Service Area</label>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="e.g. All of Baltimore City" value={form.jurisdiction_area} onChange={e => setForm(f => ({ ...f, jurisdiction_area: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Website" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Contact email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
          <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Hours" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
        </div>
        <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />

        <Button onClick={submit} disabled={!form.name.trim() || saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Agency Page'}
        </Button>
      </div>
    </div>
  );
}