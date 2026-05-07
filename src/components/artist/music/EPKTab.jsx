import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Upload, FileText, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function EPKTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const epk = artist.epk || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio_text: epk.bio_text || '', press_contact: epk.press_contact || '', press_email: epk.press_email || '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [prTitle, setPrTitle] = useState('');
  const [prDate, setPrDate] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const logoRef = useRef(null);
  const photoRef = useRef(null);

  const update = async (patch) => {
    const updated = { ...epk, ...patch };
    await base44.entities.ArtistPage.update(artist.id, { epk: updated });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const saveForm = async () => {
    setSaving(true);
    await update(form);
    setEditing(false);
    setSaving(false);
  };

  const uploadPhoto = async (file, field) => {
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (field === 'logo_url') {
      await update({ logo_url: file_url });
    } else {
      const photos = [...(epk.press_photos || []), file_url];
      await update({ press_photos: photos });
    }
    setUploading(null);
  };

  const removePhoto = async (idx) => {
    const photos = (epk.press_photos || []).filter((_, i) => i !== idx);
    await update({ press_photos: photos });
  };

  const addPressRelease = async () => {
    if (!prTitle) return;
    const prs = [...(epk.press_releases || []), { title: prTitle, date: prDate, url: prUrl }];
    await update({ press_releases: prs });
    setPrTitle(''); setPrDate(''); setPrUrl('');
  };

  const removePR = async (idx) => {
    const prs = (epk.press_releases || []).filter((_, i) => i !== idx);
    await update({ press_releases: prs });
  };

  return (
    <div className="space-y-6">
      {/* Bio + Contact */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Press Bio & Contact</h3>
          {isOwner && !editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
        </div>
        {editing ? (
          <>
            <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-32" placeholder="Full press bio" value={form.bio_text} onChange={e => setForm(f => ({ ...f, bio_text: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Press contact name" value={form.press_contact} onChange={e => setForm(f => ({ ...f, press_contact: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Press email" value={form.press_email} onChange={e => setForm(f => ({ ...f, press_email: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveForm} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            {epk.bio_text ? <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{epk.bio_text}</p> : <p className="text-sm text-muted-foreground">No press bio added yet.</p>}
            {(epk.press_contact || epk.press_email) && (
              <div className="text-sm text-muted-foreground space-y-0.5 pt-2 border-t border-border">
                {epk.press_contact && <p><span className="font-medium text-foreground">Contact:</span> {epk.press_contact}</p>}
                {epk.press_email && <p><span className="font-medium text-foreground">Email:</span> <a href={`mailto:${epk.press_email}`} className="text-accent hover:underline">{epk.press_email}</a></p>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Logo */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Logo</h3>
        {epk.logo_url
          ? <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-secondary"><img src={epk.logo_url} alt="Logo" className="w-full h-full object-contain" />
              {isOwner && <button onClick={() => update({ logo_url: '' })} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>}</div>
          : isOwner && <button onClick={() => logoRef.current?.click()} disabled={uploading === 'logo_url'} className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors w-full justify-center">
              <Upload className="w-4 h-4" />{uploading === 'logo_url' ? 'Uploading…' : 'Upload Logo'}
            </button>
        }
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0], 'logo_url')} />
      </div>

      {/* Press Photos */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Press Photos</h3>
          {isOwner && <button onClick={() => photoRef.current?.click()} disabled={uploading === 'press_photo'} className="flex items-center gap-1 text-xs text-accent hover:underline">
            <Upload className="w-3 h-3" />{uploading === 'press_photo' ? 'Uploading…' : 'Upload'}
          </button>}
        </div>
        {(epk.press_photos || []).length === 0
          ? <p className="text-sm text-muted-foreground">No press photos yet.</p>
          : <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(epk.press_photos || []).map((url, i) => (
                <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-secondary">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  {isOwner && <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
                </div>
              ))}
            </div>
        }
        <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0], 'press_photo')} />
      </div>

      {/* Press Releases */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">Press Releases</h3>
        {isOwner && (
          <div className="space-y-2 pb-3 border-b border-border">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={prTitle} onChange={e => setPrTitle(e.target.value)} />
            <div className="flex gap-2">
              <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={prDate} onChange={e => setPrDate(e.target.value)} />
              <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Link (optional)" value={prUrl} onChange={e => setPrUrl(e.target.value)} />
            </div>
            <Button size="sm" onClick={addPressRelease} disabled={!prTitle} className="bg-accent hover:bg-accent/90 text-accent-foreground"><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
          </div>
        )}
        {(epk.press_releases || []).length === 0
          ? <p className="text-sm text-muted-foreground">No press releases added yet.</p>
          : <div className="space-y-2">
              {(epk.press_releases || []).map((pr, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{pr.title}</p>
                    {pr.date && <p className="text-xs text-muted-foreground">{format(new Date(pr.date), 'MMM d, yyyy')}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {pr.url && <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1"><FileText className="w-3 h-3" />View</a>}
                    {isOwner && <button onClick={() => removePR(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}