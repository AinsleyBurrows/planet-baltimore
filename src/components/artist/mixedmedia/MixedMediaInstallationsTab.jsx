import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Frame, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMPTY = { title: '', year: '', venue: '', description: '', image_url: '' };

function InstallationForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);

  const uploadImage = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Installation title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
      </div>
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Venue / location" value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y min-h-[72px]" placeholder="Description / concept" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
      {form.image_url
        ? <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
            <img src={form.image_url} alt="installation" className="w-full h-full object-cover" />
            <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        : <button onClick={() => imgRef.current?.click()} disabled={uploading} className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Upload image
          </button>
      }
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || uploading || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function MixedMediaInstallationsTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const items = artist.installations || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtistPage.update(artist.id, { installations: list });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([form, ...items]); setShowForm(false); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this installation?')) return; await save(items.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Installation
          </Button>
        </div>
      )}
      {showForm && <InstallationForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Frame className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No installations documented yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-secondary">
                {it.image_url
                  ? <img src={it.image_url} alt={it.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Frame className="w-10 h-10 text-muted-foreground opacity-30" /></div>
                }
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">{it.title}</p>
                    {(it.year || it.venue) && <p className="text-xs text-muted-foreground mt-0.5">{[it.year, it.venue].filter(Boolean).join(' — ')}</p>}
                  </div>
                  {isOwner && (
                    <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {it.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{it.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}