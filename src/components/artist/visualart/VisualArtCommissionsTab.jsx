import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Handshake, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const REQ_STATUS = [
  { value: 'new', label: 'New', badge: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacted', badge: 'bg-amber-100 text-amber-700' },
  { value: 'accepted', label: 'Accepted', badge: 'bg-green-100 text-green-700' },
  { value: 'declined', label: 'Declined', badge: 'bg-red-100 text-red-700' },
];
const REQ_BADGE = Object.fromEntries(REQ_STATUS.map(s => [s.value, s.badge]));

function SettingEditor({ setting, onSave, onCancel, saving }) {
  const [form, setForm] = useState(setting || { accepting_commissions: true, intro: '', turnaround: '', packages: [] });
  const addPkg = () => setForm(s => ({ ...s, packages: [...(s.packages || []), { title: '', description: '', price: '', turnaround: '' }] }));
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.accepting_commissions} onChange={e => setForm(s => ({ ...s, accepting_commissions: e.target.checked }))} className="rounded" />
        <span className="text-sm font-medium text-foreground">Accepting commissions</span>
      </label>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Intro — describe your commission process, subjects, and what you offer" value={form.intro} onChange={e => setForm(s => ({ ...s, intro: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Typical turnaround (e.g. 4–6 weeks)" value={form.turnaround} onChange={e => setForm(s => ({ ...s, turnaround: e.target.value }))} />
      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Packages</span><button onClick={addPkg} className="flex items-center gap-1 text-xs text-accent hover:underline"><Plus className="w-3 h-3" /> Add</button></div>
        {(form.packages || []).map((p, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input className="col-span-4 px-2 py-1.5 rounded-lg border border-input bg-background text-sm" placeholder="Title" value={p.title} onChange={e => setForm(s => ({ ...s, packages: s.packages.map((x, j) => j === i ? { ...x, title: e.target.value } : x) }))} />
            <input className="col-span-4 px-2 py-1.5 rounded-lg border border-input bg-background text-sm" placeholder="Description" value={p.description} onChange={e => setForm(s => ({ ...s, packages: s.packages.map((x, j) => j === i ? { ...x, description: e.target.value } : x) }))} />
            <input className="col-span-3 px-2 py-1.5 rounded-lg border border-input bg-background text-sm" placeholder="Price" value={p.price} onChange={e => setForm(s => ({ ...s, packages: s.packages.map((x, j) => j === i ? { ...x, price: e.target.value } : x) }))} />
            <button onClick={() => setForm(s => ({ ...s, packages: s.packages.filter((_, j) => j !== i) }))} className="col-span-1 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function RequestForm({ artistId, packages, onSubmit }) {
  const [form, setForm] = useState({ requester_name: '', email: '', size: '', medium: '', budget: '', timeline: '', message: '', package_title: '' });
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!form.requester_name || !form.email) return;
    setSaving(true);
    await base44.entities.CommissionRequest.create({ ...form, artist_id: artistId });
    setSaving(false);
    setForm({ requester_name: '', email: '', size: '', medium: '', budget: '', timeline: '', message: '', package_title: '' });
    onSubmit();
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Your name *" value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Email *" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      {packages?.length > 0 && <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.package_title} onChange={e => setForm(f => ({ ...f, package_title: e.target.value }))}><option value="">Select a package (optional)</option>{packages.map((p, i) => <option key={i} value={p.title}>{p.title}</option>)}</select>}
      <div className="grid grid-cols-3 gap-2">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Size" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Medium" value={form.medium} onChange={e => setForm(f => ({ ...f, medium: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Budget" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Timeline (e.g. needed by Dec)" value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-24" placeholder="Describe your project — subject, references, anything that helps" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
      <Button size="sm" onClick={submit} disabled={saving || !form.requester_name || !form.email} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Sending…' : 'Send Request'}</Button>
    </div>
  );
}

export default function VisualArtCommissionsTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const { data: setting } = useQuery({ queryKey: ['commission-setting', artistId], queryFn: () => base44.entities.CommissionSetting.filter({ artist_id: artistId }, '-created_date', 1).then(r => r[0] || null), enabled: !!artistId });
  const { data: requests = [], isLoading } = useQuery({ queryKey: ['commission-requests', artistId], queryFn: () => base44.entities.CommissionRequest.filter({ artist_id: artistId }, '-created_date', 100), enabled: !!artistId });
  const [editSetting, setEditSetting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const saveSetting = async (form) => {
    setSaving(true);
    if (setting?.id) await base44.entities.CommissionSetting.update(setting.id, form);
    else await base44.entities.CommissionSetting.create({ ...form, artist_id: artistId, owner_id: ownerId });
    setSaving(false); setEditSetting(false);
    queryClient.invalidateQueries({ queryKey: ['commission-setting', artistId] });
  };
  const setStatus = async (req, status) => { await base44.entities.CommissionRequest.update(req.id, { status }); queryClient.invalidateQueries({ queryKey: ['commission-requests', artistId] }); };
  const accepting = setting?.accepting_commissions !== false;

  return (
    <div className="space-y-5">
      {isOwner && editSetting ? (
        <SettingEditor setting={setting} onSave={saveSetting} onCancel={() => setEditSetting(false)} saving={saving} />
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Handshake className="w-5 h-5 text-foreground" /><h3 className="font-semibold text-foreground">Commissions</h3></div>
            {isOwner && <Button size="sm" variant="outline" onClick={() => setEditSetting(true)} className="gap-1.5"><Pencil className="w-3.5 h-3.5" /> Edit</Button>}
          </div>
          {accepting ? <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Accepting commissions</Badge> : <Badge className="bg-muted text-muted-foreground border-0 text-[10px]">Not accepting right now</Badge>}
          {setting?.intro && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{setting.intro}</p>}
          {setting?.turnaround && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Clock className="w-3 h-3" />Typical turnaround: {setting.turnaround}</p>}
          {setting?.packages?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {setting.packages.map((p, i) => (
                <div key={i} className="border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between"><p className="font-semibold text-sm text-foreground">{p.title}</p>{p.price && <span className="font-bold text-sm text-accent">{p.price}</span>}</div>
                  {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isOwner && accepting && (
        submitted ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center"><CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" /><p className="text-sm font-medium text-foreground">Request sent!</p><p className="text-xs text-muted-foreground mt-1">The artist will be in touch soon.</p></div>
        ) : <RequestForm artistId={artistId} packages={setting?.packages} onSubmit={() => setSubmitted(true)} />
      )}

      {isOwner && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Requests ({requests.length})</h3>
          {isLoading ? <div className="h-20 rounded-xl bg-muted animate-pulse" /> : requests.length === 0 ? <p className="text-sm text-muted-foreground py-6 text-center">No commission requests yet.</p> : (
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{r.requester_name} <span className="text-xs text-muted-foreground font-normal">· {r.email}</span></p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                        {r.package_title && <Badge variant="secondary">{r.package_title}</Badge>}
                        {r.size && <Badge variant="secondary">Size: {r.size}</Badge>}
                        {r.medium && <Badge variant="secondary">{r.medium}</Badge>}
                        {r.budget && <Badge variant="secondary"><DollarSign className="w-2.5 h-2.5 mr-0.5" />{r.budget}</Badge>}
                        {r.timeline && <Badge variant="secondary"><Clock className="w-2.5 h-2.5 mr-0.5" />{r.timeline}</Badge>}
                      </div>
                      {r.message && <p className="text-xs text-muted-foreground mt-2">{r.message}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${REQ_BADGE[r.status] || ''}`}>{r.status}</span>
                      <select value={r.status} onChange={e => setStatus(r, e.target.value)} className="text-[10px] px-2 py-1 rounded-lg border border-input bg-background">
                        {REQ_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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