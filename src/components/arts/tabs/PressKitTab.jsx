import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, ExternalLink, Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PressKitTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const pk = org.press_kit || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ press_contact: pk.press_contact || '', press_email: pk.press_email || '', bio_text: pk.bio_text || '', logo_url: pk.logo_url || '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const releaseInputRef = useRef(null);

  const updatePK = async (data) => {
    await base44.entities.ArtsOrganization.update(org.id, { press_kit: { ...pk, ...data } });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const saveInfo = async () => {
    setSaving(true);
    await updatePK(form);
    setSaving(false);
    setEditing(false);
  };

  const uploadLogo = async (file) => {
    setUploading('logo');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, logo_url: file_url }));
    await updatePK({ ...form, logo_url: file_url });
    setUploading(false);
  };

  const uploadPressImage = async (file) => {
    setUploading('image');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await updatePK({ press_images: [...(pk.press_images || []), file_url] });
    setUploading(false);
  };

  const removePressImage = async (idx) => {
    await updatePK({ press_images: (pk.press_images || []).filter((_, i) => i !== idx) });
  };

  const addRelease = async (file) => {
    setUploading('release');
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const title = file.name.replace(/\.[^.]+$/, '');
    const date = new Date().toISOString().split('T')[0];
    await updatePK({ press_releases: [...(pk.press_releases || []), { title, date, url: file_url }] });
    setUploading(false);
  };

  const removeRelease = async (idx) => {
    await updatePK({ press_releases: (pk.press_releases || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      {/* Contact & Bio */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Press Contact</p>
          {isOwner && !editing && <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs text-accent hover:underline"><Pencil className="w-3 h-3" />Edit</button>}
        </div>
        {editing ? (
          <div className="space-y-2">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Contact name" value={form.press_contact} onChange={e => setForm(f => ({ ...f, press_contact: e.target.value }))} />
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Press email" value={form.press_email} onChange={e => setForm(f => ({ ...f, press_email: e.target.value }))} />
            <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-24" placeholder="Press bio / boilerplate text" value={form.bio_text} onChange={e => setForm(f => ({ ...f, bio_text: e.target.value }))} />
            <div className="flex gap-2">
              <Button size="sm" onClick={saveInfo} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-sm text-foreground">
            {pk.press_contact && <p><span className="text-muted-foreground">Contact: </span>{pk.press_contact}</p>}
            {pk.press_email && <p><span className="text-muted-foreground">Email: </span><a href={`mailto:${pk.press_email}`} className="text-accent hover:underline">{pk.press_email}</a></p>}
            {pk.bio_text && <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{pk.bio_text}</p>}
            {!pk.press_contact && !pk.press_email && !pk.bio_text && <p className="text-muted-foreground text-sm">No press contact info added yet.</p>}
          </div>
        )}
      </div>

      {/* Logo */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Logo</p>
        {pk.logo_url ? (
          <div className="flex items-center gap-3">
            <img src={pk.logo_url} alt="Logo" className="h-16 object-contain rounded-lg border border-border bg-secondary p-1" />
            {isOwner && <button onClick={() => updatePK({ logo_url: '' })} className="text-xs text-destructive hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" />Remove</button>}
          </div>
        ) : (
          isOwner && (
            <button onClick={() => logoInputRef.current?.click()} disabled={uploading === 'logo'} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm transition-colors">
              <Upload className="w-4 h-4" />{uploading === 'logo' ? 'Uploading…' : 'Upload Logo'}
            </button>
          )
        )}
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadLogo(e.target.files[0])} />
      </div>

      {/* Press Images */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Press Images</p>
        <div className="grid grid-cols-3 gap-2">
          {(pk.press_images || []).map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-secondary">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {isOwner && (
                <button onClick={() => removePressImage(i)} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {isOwner && (
            <button onClick={() => imageInputRef.current?.click()} disabled={uploading === 'image'} className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-accent flex items-center justify-center text-muted-foreground hover:text-accent transition-colors">
              <Upload className="w-5 h-5" />
            </button>
          )}
        </div>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadPressImage(e.target.files[0])} />
      </div>

      {/* Press Releases */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">Press Releases</p>
        {(pk.press_releases || []).map((pr, i) => (
          <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{pr.title}</p>
              {pr.date && <p className="text-xs text-muted-foreground">{pr.date}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a href={pr.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline text-xs flex items-center gap-1"><ExternalLink className="w-3 h-3" />View</a>
              {isOwner && <button onClick={() => removeRelease(i)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
          </div>
        ))}
        {isOwner && (
          <button onClick={() => releaseInputRef.current?.click()} disabled={uploading === 'release'} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm transition-colors">
            <Upload className="w-4 h-4" />{uploading === 'release' ? 'Uploading…' : 'Upload Press Release'}
          </button>
        )}
        <input ref={releaseInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => e.target.files[0] && addRelease(e.target.files[0])} />
      </div>
    </div>
  );
}