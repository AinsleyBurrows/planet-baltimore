import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, Phone, Mail, Car, Accessibility, Navigation, Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VisitTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const info = org.visit_info || {};

  const save = async (data) => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { visit_info: data });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setSaving(false);
    setEditing(false);
  };

  if (editing) return <VisitForm initial={info} onSave={save} onCancel={() => setEditing(false)} saving={saving} />;

  const admission = info.admission || [];
  const directions = info.directions_url || (org.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(org.address)}` : null);

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5 rounded-lg"><Pencil className="w-3.5 h-3.5" /> Edit Visit Info</Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {/* Admission */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Admission</p>
          {info.free_admission ? (
            <p className="text-2xl font-bold text-foreground">Free</p>
          ) : admission.length > 0 ? (
            <ul className="space-y-1.5">
              {admission.map((a, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{a.label}</span>
                  <span className="font-medium text-foreground">{a.price}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Admission info not listed.</p>}
        </div>

        {/* Hours */}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Hours</p>
          {org.hours ? <p className="text-sm text-foreground whitespace-pre-wrap">{org.hours}</p> : <p className="text-sm text-muted-foreground">Not listed.</p>}
        </div>
      </div>

      {/* Location */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Location</p>
        {org.address ? (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground">{org.address}</p>
            {directions && <a href={directions} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline flex-shrink-0"><Navigation className="w-3 h-3" /> Directions</a>}
          </div>
        ) : <p className="text-sm text-muted-foreground">Address not listed.</p>}
        {(org.phone || org.contact_email) && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-border text-sm text-muted-foreground">
            {org.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{org.phone}</span>}
            {org.contact_email && <a href={`mailto:${org.contact_email}`} className="flex items-center gap-1.5 text-accent hover:underline"><Mail className="w-3.5 h-3.5" />{org.contact_email}</a>}
          </div>
        )}
      </div>

      {/* Parking & Accessibility */}
      {(info.parking_notes || info.accessibility_info) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {info.parking_notes && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Car className="w-3.5 h-3.5" /> Parking</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{info.parking_notes}</p>
            </div>
          )}
          {info.accessibility_info && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Accessibility className="w-3.5 h-3.5" /> Accessibility</p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{info.accessibility_info}</p>
            </div>
          )}
        </div>
      )}

      {!info.free_admission && admission.length === 0 && !org.hours && !org.address && !info.parking_notes && !info.accessibility_info && (
        <p className="text-center py-8 text-sm text-muted-foreground">No visit info added yet.</p>
      )}
    </div>
  );
}

function VisitForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => ({
    free_admission: initial.free_admission || false,
    parking_notes: initial.parking_notes || '',
    accessibility_info: initial.accessibility_info || '',
    directions_url: initial.directions_url || '',
    admission: initial.admission || [],
  }));

  const addAdmission = () => setForm(f => ({ ...f, admission: [...f.admission, { label: '', price: '' }] }));
  const updateAdmission = (i, field, val) => setForm(f => ({ ...f, admission: f.admission.map((a, j) => j === i ? { ...a, [field]: val } : a) }));
  const removeAdmission = (i) => setForm(f => ({ ...f, admission: f.admission.filter((_, j) => j !== i) }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <input type="checkbox" checked={form.free_admission} onChange={e => setForm(f => ({ ...f, free_admission: e.target.checked }))} className="w-4 h-4 rounded" />
        Free admission
      </label>

      {!form.free_admission && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admission Prices</p>
            <button onClick={addAdmission} className="flex items-center gap-1 text-xs text-accent hover:underline"><Plus className="w-3 h-3" /> Add</button>
          </div>
          <div className="space-y-2">
            {form.admission.map((a, i) => (
              <div key={i} className="flex gap-2">
                <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Label (e.g. Adult)" value={a.label} onChange={e => updateAdmission(i, 'label', e.target.value)} />
                <input className="w-28 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Price" value={a.price} onChange={e => updateAdmission(i, 'price', e.target.value)} />
                <button onClick={() => removeAdmission(i)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {form.admission.length === 0 && <p className="text-xs text-muted-foreground">No prices added.</p>}
          </div>
        </div>
      )}

      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Parking notes (optional)" value={form.parking_notes} onChange={e => setForm(f => ({ ...f, parking_notes: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Accessibility info (optional)" value={form.accessibility_info} onChange={e => setForm(f => ({ ...f, accessibility_info: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Directions URL (optional — defaults to Google Maps)" value={form.directions_url} onChange={e => setForm(f => ({ ...f, directions_url: e.target.value }))} />

      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}