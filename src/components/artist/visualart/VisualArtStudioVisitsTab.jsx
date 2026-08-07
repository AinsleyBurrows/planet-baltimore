import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Pencil, MapPin, Clock, CheckCircle2, Calendar, Video, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS = [{ value: 'pending', label: 'Pending', badge: 'bg-amber-100 text-amber-700' }, { value: 'confirmed', label: 'Confirmed', badge: 'bg-green-100 text-green-700' }, { value: 'declined', label: 'Declined', badge: 'bg-red-100 text-red-700' }];
const STATUS_BADGE = Object.fromEntries(STATUS.map(s => [s.value, s.badge]));

function SettingEditor({ setting, onSave, onCancel, saving }) {
  const [form, setForm] = useState(setting || { address: '', hours: '', visit_types: '', notes: '' });
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Studio address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Available hours (e.g. Sat 12–4pm by appt)" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Visit types offered (in-person, virtual, studio tour)" value={form.visit_types} onChange={e => setForm(f => ({ ...f, visit_types: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Notes — parking, what to expect, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      <div className="flex gap-2"><Button size="sm" onClick={() => onSave(form)} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button><Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}

function RequestForm({ artistId, onSubmit }) {
  const [form, setForm] = useState({ requester_name: '', email: '', preferred_date: '', preferred_time: '', visit_type: 'in_person', brief: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.requester_name || !form.email) return;
    setSaving(true);
    await base44.entities.StudioVisitRequest.create({ ...form, artist_id: artistId });
    setSaving(false);
    setForm({ requester_name: '', email: '', preferred_date: '', preferred_time: '', visit_type: 'in_person', brief: '' });
    onSubmit();
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Your name *" value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input type="date" className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.preferred_date} onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Time" value={form.preferred_time} onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))} />
        <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.visit_type} onChange={e => setForm(f => ({ ...f, visit_type: e.target.value }))}><option value="in_person">In-Person</option><option value="virtual">Virtual</option></select>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Brief — what you'd like to see or discuss" value={form.brief} onChange={e => setForm(f => ({ ...f, brief: e.target.value }))} />
      <Button size="sm" onClick={submit} disabled={saving || !form.requester_name || !form.email} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Sending…' : 'Request Visit'}</Button>
    </div>
  );
}

export default function VisualArtStudioVisitsTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const { data: setting } = useQuery({ queryKey: ['studio-visit-setting', artistId], queryFn: () => base44.entities.StudioVisitSetting.filter({ artist_id: artistId }, '-created_date', 1).then(r => r[0] || null), enabled: !!artistId });
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['studio-visit-requests', artistId], queryFn: () => base44.entities.StudioVisitRequest.filter({ artist_id: artistId }, '-created_date', 100), enabled: !!artistId });
  const [editSetting, setEditSetting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const saveSetting = async (form) => {
    setSaving(true);
    if (setting?.id) await base44.entities.StudioVisitSetting.update(setting.id, form);
    else await base44.entities.StudioVisitSetting.create({ ...form, artist_id: artistId, owner_id: ownerId });
    setSaving(false); setEditSetting(false);
    queryClient.invalidateQueries({ queryKey: ['studio-visit-setting', artistId] });
  };
  const setStatus = async (req, status) => { await base44.entities.StudioVisitRequest.update(req.id, { status }); queryClient.invalidateQueries({ queryKey: ['studio-visit-requests', artistId] }); };

  return (
    <div className="space-y-5">
      {isOwner && editSetting ? (
        <SettingEditor setting={setting} onSave={saveSetting} onCancel={() => setEditSetting(false)} saving={saving} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Studio Visits</h3>
            {isOwner && <Button size="sm" variant="outline" onClick={() => setEditSetting(true)} className="gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</Button>}
          </div>
          {setting?.address && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2"><MapPin className="w-3.5 h-3.5" />{setting.address}</p>}
          {setting?.hours && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><Clock className="w-3.5 h-3.5" />{setting.hours}</p>}
          {setting?.visit_types && <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1"><DoorOpen className="w-3.5 h-3.5" />{setting.visit_types}</p>}
          {setting?.notes && <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{setting.notes}</p>}
          {!setting && !isOwner && <p className="text-sm text-muted-foreground mt-2">Request a studio visit below.</p>}
        </div>
      )}

      {!isOwner && (submitted ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-center"><CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" /><p className="text-sm font-medium text-foreground">Visit requested!</p><p className="text-xs text-muted-foreground mt-1">The artist will confirm with you.</p></div>
      ) : <RequestForm artistId={artistId} onSubmit={() => setSubmitted(true)} />)}

      {isOwner && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Visit Requests ({requests.length})</h3>
          {isLoading ? <div className="h-20 rounded-xl bg-muted animate-pulse" /> : requests.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No visit requests yet.</p> : (
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{r.requester_name} <span className="text-xs text-muted-foreground font-normal">· {r.email}</span></p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                        {r.preferred_date && <Badge variant="secondary"><Calendar className="w-2.5 h-2.5 mr-0.5" />{r.preferred_date}</Badge>}
                        {r.preferred_time && <Badge variant="secondary">{r.preferred_time}</Badge>}
                        <Badge variant="secondary">{r.visit_type === 'virtual' ? <><Video className="w-2.5 h-2.5 mr-0.5" />Virtual</> : <><DoorOpen className="w-2.5 h-2.5 mr-0.5" />In-Person</>}</Badge>
                      </div>
                      {r.brief && <p className="text-xs text-muted-foreground mt-2">{r.brief}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${STATUS_BADGE[r.status] || ''}`}>{r.status}</span>
                      <select value={r.status} onChange={e => setStatus(r, e.target.value)} className="text-[10px] px-2 py-1 rounded-lg border border-input bg-background">
                        {STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}