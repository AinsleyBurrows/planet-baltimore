import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, MapPin, Phone, Mail, Clock, Globe, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPORT_CATEGORIES = ['Pothole / Road', 'Missed Trash Pickup', 'Graffiti', 'Streetlight Out', 'Noise Complaint', 'Parking Issue', 'Tree / Sidewalk', 'Water / Sewer', 'Other'];
const REPORT_STATUSES = [
  { value: 'new', label: 'New', badge: 'bg-blue-100 text-blue-700' },
  { value: 'reviewing', label: 'Reviewing', badge: 'bg-amber-100 text-amber-700' },
  { value: 'resolved', label: 'Resolved', badge: 'bg-green-100 text-green-700' },
];

export default function GovContactTab({ agency, isOwner, user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ category: 'Pothole / Road', location: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef(null);

  const reports = agency.reports || [];

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const submit = async () => {
    if (!form.description.trim()) return;
    setSaving(true);
    let image_url = '';
    if (imageFile) {
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
    }
    const newReport = {
      id: `rpt_${Date.now()}`,
      category: form.category,
      location: form.location.trim(),
      description: form.description.trim(),
      submitted_by_name: user?.full_name || 'Anonymous',
      submitted_by_email: user?.email || '',
      submitted_at: new Date().toISOString(),
      status: 'new',
      image_url,
    };
    await base44.entities.GovernmentAgency.update(agency.id, { reports: [newReport, ...reports] });
    setSaving(false);
    setForm({ category: 'Pothole / Road', location: '', description: '' });
    setImageFile(null);
    setImagePreview('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  const updateStatus = async (reportId, status) => {
    const next = reports.map(r => r.id === reportId ? { ...r, status } : r);
    await base44.entities.GovernmentAgency.update(agency.id, { reports: next });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  return (
    <div className="space-y-6">
      {/* Contact info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground">Contact</h2>
        <div className="space-y-2 text-sm">
          {agency.address && <div className="flex gap-2 text-muted-foreground"><MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" /> {agency.address}</div>}
          {agency.phone && <a href={`tel:${agency.phone}`} className="flex gap-2 text-muted-foreground hover:text-accent"><Phone className="w-4 h-4 flex-shrink-0" /> {agency.phone}</a>}
          {agency.contact_email && <a href={`mailto:${agency.contact_email}`} className="flex gap-2 text-muted-foreground hover:text-accent"><Mail className="w-4 h-4 flex-shrink-0" /> {agency.contact_email}</a>}
          {agency.hours && <div className="flex gap-2 text-muted-foreground"><Clock className="w-4 h-4 flex-shrink-0 mt-0.5" /> {agency.hours}</div>}
          {agency.website && <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex gap-2 text-accent hover:underline"><Globe className="w-4 h-4 flex-shrink-0" /> {agency.website}</a>}
        </div>
      </div>

      {/* Report an issue form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-foreground">Report an Issue</h2>
        <p className="text-sm text-muted-foreground">Submit a 311-style request — potholes, missed pickups, streetlights, and more.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {REPORT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Location / address" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        </div>
        <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Describe the issue *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent text-sm text-muted-foreground hover:text-accent transition-colors">
            <Upload className="w-4 h-4" /> {imagePreview ? 'Photo attached ✓' : 'Add photo (optional)'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          {imagePreview && <img src={imagePreview} alt="" className="w-12 h-12 rounded-lg object-cover" />}
        </div>
        <Button onClick={submit} disabled={!form.description.trim() || saving} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {saving ? 'Submitting…' : 'Submit Report'}
        </Button>
        {submitted && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" /> Your report has been submitted. Thank you!
          </div>
        )}
      </div>

      {/* Recent reports (owner sees all with status management) */}
      {isOwner && reports.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-foreground">Recent Reports ({reports.length})</h2>
          <div className="space-y-2">
            {reports.slice(0, 20).map(r => {
              const status = REPORT_STATUSES.find(s => s.value === r.status);
              return (
                <div key={r.id} className="bg-card border border-border rounded-xl p-3 flex gap-3">
                  {r.image_url && <img src={r.image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{r.category}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${status?.badge || 'bg-secondary text-muted-foreground'}`}>{status?.label || r.status}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{r.description}</p>
                    {r.location && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">By {r.submitted_by_name} · {new Date(r.submitted_at).toLocaleDateString()}</p>
                    <div className="flex gap-1 mt-2">
                      {REPORT_STATUSES.map(s => (
                        <button key={s.value} onClick={() => updateStatus(r.id, s.value)} className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${r.status === s.value ? 'bg-accent text-accent-foreground border-accent' : 'border-border text-muted-foreground hover:border-accent'}`}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}