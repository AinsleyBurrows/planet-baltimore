import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Loader2, Image as ImageIcon, X, MapPin, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPES = [{ value: 'solo', label: 'Solo' }, { value: 'group', label: 'Group' }, { value: 'booth', label: 'Booth' }, { value: 'fair', label: 'Fair' }, { value: 'residency', label: 'Residency' }, { value: 'other', label: 'Other' }];
const EMPTY = { title: '', venue: '', city: '', start_date: '', end_date: '', exhibition_type: 'solo', reception_date: '', description: '', installation_shots: [], works: [] };

function statusOf(ex) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = ex.start_date ? new Date(ex.start_date) : null;
  const end = ex.end_date ? new Date(ex.end_date) : null;
  if (start && end) { if (end < today) return 'past'; if (start > today) return 'upcoming'; return 'current'; }
  if (start && start > today) return 'upcoming';
  if (end && end < today) return 'past';
  return 'current';
}

function ExForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial ? { ...EMPTY, ...initial, works: initial.works || [] } : EMPTY);
  const [uploading, setUploading] = useState(false);
  const [activeWork, setActiveWork] = useState(null);
  const imgRef = useRef(null);
  const workImgRef = useRef(null);
  const addShots = async (files) => { setUploading(true); const urls = []; for (const f of files) { const { file_url } = await base44.integrations.Core.UploadFile({ file: f }); urls.push(file_url); } setForm(s => ({ ...s, installation_shots: [...(s.installation_shots || []), ...urls] })); setUploading(false); };
  const uploadWorkImg = async (file) => { setUploading(true); const { file_url } = await base44.integrations.Core.UploadFile({ file }); setForm(s => ({ ...s, works: s.works.map((w, j) => j === activeWork ? { ...w, image_url: file_url } : w) })); setUploading(false); setActiveWork(null); };
  const setWork = (i, patch) => setForm(s => ({ ...s, works: s.works.map((w, j) => j === i ? { ...w, ...patch } : w) }));
  const addWork = () => setForm(s => ({ ...s, works: [...(s.works || []), { title: '', year: '', medium: '', dimensions: '', image_url: '' }] }));
  const removeWork = (i) => setForm(s => ({ ...s, works: s.works.filter((_, j) => j !== i) }));
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Exhibition title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="City" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input type="date" className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
        <input type="date" className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
        <select className="px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.exhibition_type} onChange={e => setForm(f => ({ ...f, exhibition_type: e.target.value }))}>{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Reception / opening (optional)" value={form.reception_date} onChange={e => setForm(f => ({ ...f, reception_date: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <div>
        <button onClick={() => imgRef.current?.click()} className="flex items-center gap-1.5 text-xs text-accent hover:underline"><ImageIcon className="w-3.5 h-3.5" /> Add installation shots</button>
        {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin inline ml-2" />}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {(form.installation_shots || []).map((u, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
              <img src={u} alt="" className="w-full h-full object-cover" />
              <button onClick={() => setForm(s => ({ ...s, installation_shots: s.installation_shots.filter((_, j) => j !== i) }))} className="absolute top-1 right-1 p-0.5 rounded bg-black/60 text-white"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
        <input ref={imgRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files.length && addShots(Array.from(e.target.files))} />
      </div>
      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Artworks in this exhibition</p>
        {(form.works || []).map((w, i) => (
          <div key={i} className="flex gap-3 items-start p-2 rounded-lg border border-border bg-background/50">
            <button type="button" onClick={() => { setActiveWork(i); workImgRef.current?.click(); }} className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border flex items-center justify-center relative">
              {w.image_url ? <img src={w.image_url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
              {uploading && activeWork === i && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white animate-spin" /></div>}
            </button>
            <div className="flex-1 grid grid-cols-2 gap-1.5">
              <input className="col-span-2 px-2 py-1.5 rounded-md border border-input bg-background text-sm" placeholder="Work title *" value={w.title} onChange={e => setWork(i, { title: e.target.value })} />
              <input className="px-2 py-1.5 rounded-md border border-input bg-background text-sm" placeholder="Year" value={w.year} onChange={e => setWork(i, { year: e.target.value })} />
              <input className="px-2 py-1.5 rounded-md border border-input bg-background text-sm" placeholder="Medium" value={w.medium} onChange={e => setWork(i, { medium: e.target.value })} />
              <input className="col-span-2 px-2 py-1.5 rounded-md border border-input bg-background text-sm" placeholder="Size / dimensions" value={w.dimensions} onChange={e => setWork(i, { dimensions: e.target.value })} />
            </div>
            <button type="button" onClick={() => removeWork(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={addWork} className="flex items-center gap-1.5 text-xs text-accent hover:underline"><Plus className="w-3.5 h-3.5" /> Add artwork</button>
        <input ref={workImgRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files[0]) uploadWorkImg(e.target.files[0]); e.target.value = ''; }} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function ExCard({ ex, isOwner, onEdit, onDelete }) {
  const st = statusOf(ex);
  const badge = st === 'current' ? 'bg-green-100 text-green-700' : st === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground';
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      <div className="grid grid-cols-3 gap-1 bg-secondary">
        {(ex.installation_shots || []).slice(0, 3).map((u, i) => <div key={i} className="aspect-square"><img src={u} alt="" className="w-full h-full object-cover" /></div>)}
        {(!ex.installation_shots || ex.installation_shots.length === 0) && <div className="col-span-3 aspect-video flex items-center justify-center"><Building2 className="w-8 h-8 text-muted-foreground/40" /></div>}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif text-base font-medium text-foreground truncate leading-tight">{ex.title}</p>
            {ex.venue && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{ex.venue}{ex.city && `, ${ex.city}`}</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${badge}`}>{st}</span>
            {isOwner && <div className="flex gap-1">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />{ex.start_date || 'TBD'}{ex.end_date && ` → ${ex.end_date}`}</p>
        <div className="flex items-center gap-1.5 mt-1.5"><Badge variant="secondary" className="text-[10px] capitalize">{ex.exhibition_type}</Badge>{ex.reception_date && <span className="text-[10px] text-accent">Reception {ex.reception_date}</span>}</div>
        {ex.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>}
        {ex.works && ex.works.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Artworks</p>
            {ex.works.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                {w.image_url && <img src={w.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                <div className="min-w-0 text-xs">
                  <p className="font-serif italic text-foreground truncate">{w.title || 'Untitled'}{w.year ? `, ${w.year}` : ''}</p>
                  {(w.medium || w.dimensions) && <p className="text-muted-foreground truncate">{[w.medium, w.dimensions].filter(Boolean).join(' · ')}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisualArtExhibitionsTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const { data: exhibitions = [], isLoading } = useQuery({ queryKey: ['exhibitions', artistId], queryFn: () => base44.entities.Exhibition.filter({ artist_id: artistId }, '-start_date', 100), enabled: !!artistId });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['exhibitions', artistId] });
  const saveNew = async (form) => { setSaving(true); await base44.entities.Exhibition.create({ ...form, artist_id: artistId, owner_id: ownerId }); setSaving(false); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { setSaving(true); await base44.entities.Exhibition.update(editing.id, form); setSaving(false); setEditing(null); refresh(); };
  const del = async (ex) => { if (!window.confirm('Remove this exhibition?')) return; await base44.entities.Exhibition.delete(ex.id); refresh(); };

  const groups = { current: [], upcoming: [], past: [] };
  exhibitions.forEach(e => groups[statusOf(e)]?.push(e));

  if (isLoading) return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-5">
      {isOwner && !showForm && editing === null && <div className="flex justify-end"><Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Exhibition</Button></div>}
      {showForm && <ExForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {exhibitions.length === 0 && !showForm && <div className="text-center py-16"><Building2 className="w-10 h-10 mx-auto mb-3 opacity-25" /><p className="font-serif text-base text-muted-foreground">No exhibitions listed.</p></div>}
      {['current', 'upcoming', 'past'].map(key => groups[key].length > 0 && (
        <div key={key}>
          <h3 className="font-serif text-sm font-medium tracking-wide text-foreground mb-3 flex items-center gap-2"><span className="w-6 h-px bg-border" />{key === 'current' ? 'Current' : key === 'upcoming' ? 'Upcoming' : 'Past'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groups[key].map(ex => editing?.id === ex.id ? <ExForm key={ex.id} initial={ex} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving} /> : <ExCard key={ex.id} ex={ex} isOwner={isOwner} onEdit={() => setEditing(ex)} onDelete={() => del(ex)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}