import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Mail, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function PressKitTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const kit = org.press_kit || {};
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    press_contact: kit.press_contact || '',
    press_email: kit.press_email || '',
    bio_text: kit.bio_text || '',
    logo_url: kit.logo_url || '',
    press_images: kit.press_images || [],
    press_releases: kit.press_releases || [],
  });
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newRelease, setNewRelease] = useState({ title: '', date: '', url: '' });

  const save = async () => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { press_kit: form });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setEditing(false);
    setSaving(false);
  };

  const addImage = () => {
    if (newImageUrl.trim()) { setForm(f => ({ ...f, press_images: [...f.press_images, newImageUrl.trim()] })); setNewImageUrl(''); }
  };

  const addRelease = () => {
    if (newRelease.title.trim()) { setForm(f => ({ ...f, press_releases: [...f.press_releases, { ...newRelease }] })); setNewRelease({ title: '', date: '', url: '' }); }
  };

  const displayKit = editing ? form : kit;

  return (
    <div className="space-y-5">
      {isOwner && (
        <div className="flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5"><Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Save'}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-1.5"><FileText className="w-3.5 h-3.5" />Edit Press Kit</Button>
          )}
        </div>
      )}

      {/* Contact */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Media Contact</p>
        {editing ? (
          <div className="space-y-2">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Contact Name" value={form.press_contact} onChange={e => setForm(f => ({ ...f, press_contact: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Press Email" value={form.press_email} onChange={e => setForm(f => ({ ...f, press_email: e.target.value }))} />
          </div>
        ) : (
          <>
            {displayKit.press_contact && <p className="text-sm font-medium text-foreground">{displayKit.press_contact}</p>}
            {displayKit.press_email && <a href={`mailto:${displayKit.press_email}`} className="flex items-center gap-1.5 text-sm text-accent hover:underline"><Mail className="w-3.5 h-3.5" />{displayKit.press_email}</a>}
            {!displayKit.press_contact && !displayKit.press_email && <p className="text-sm text-muted-foreground">No press contact listed.</p>}
          </>
        )}
      </div>

      {/* Bio */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Organization Bio</p>
        {editing ? (
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-28" placeholder="Boilerplate org bio for press use…" value={form.bio_text} onChange={e => setForm(f => ({ ...f, bio_text: e.target.value }))} />
        ) : (
          <p className="text-sm text-foreground leading-relaxed">{displayKit.bio_text || <span className="text-muted-foreground">No bio text added.</span>}</p>
        )}
      </div>

      {/* Logo */}
      {(editing || displayKit.logo_url) && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Logo</p>
          {editing ? (
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Logo URL" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
          ) : (
            <img src={displayKit.logo_url} alt="Logo" className="h-16 object-contain" />
          )}
        </div>
      )}

      {/* Press Images */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Press Images</p>
        {editing && (
          <div className="flex gap-2 mb-3">
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Image URL" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && addImage()} />
            <Button size="sm" variant="outline" onClick={addImage}><Plus className="w-3.5 h-3.5" /></Button>
          </div>
        )}
        {(editing ? form.press_images : displayKit.press_images || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No press images yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(editing ? form.press_images : displayKit.press_images || []).map((url, i) => (
              <div key={i} className="relative group aspect-video rounded-lg overflow-hidden bg-secondary">
                <img src={url} alt="" className="w-full h-full object-cover" />
                {editing && <button onClick={() => setForm(f => ({ ...f, press_images: f.press_images.filter((_, j) => j !== i) }))} className="absolute top-1 right-1 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Press Releases */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Press Releases</p>
        {editing && (
          <div className="space-y-2 mb-3">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Release Title" value={newRelease.title} onChange={e => setNewRelease(r => ({ ...r, title: e.target.value }))} />
            <div className="flex gap-2">
              <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={newRelease.date} onChange={e => setNewRelease(r => ({ ...r, date: e.target.value }))} />
              <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="URL (optional)" value={newRelease.url} onChange={e => setNewRelease(r => ({ ...r, url: e.target.value }))} />
              <Button size="sm" variant="outline" onClick={addRelease}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )}
        {(editing ? form.press_releases : displayKit.press_releases || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No press releases yet.</p>
        ) : (
          <div className="space-y-2">
            {(editing ? form.press_releases : displayKit.press_releases || []).map((pr, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-3 bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">{pr.title}</p>
                  {pr.date && <p className="text-xs text-muted-foreground">{format(new Date(pr.date), 'MMMM d, yyyy')}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  {pr.url && <a href={pr.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition-colors"><Download className="w-4 h-4" /></a>}
                  {editing && <button onClick={() => setForm(f => ({ ...f, press_releases: f.press_releases.filter((_, j) => j !== i) }))} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}