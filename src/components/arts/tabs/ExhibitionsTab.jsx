import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ImageIcon, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const EMPTY = { title: '', description: '', start_date: '', end_date: '', start_time: '', end_time: '', image_url: '', is_current: false };

function ExhibitionForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div
          className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer border border-border hover:border-accent transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {form.image_url ? (
            <img src={form.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          )}
          {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Exhibition Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div className="flex gap-2">
            <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Start date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            <input type="date" className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="End date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-0.5">
              <label className="text-xs text-muted-foreground">Opening time</label>
              <input type="time" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
            </div>
            <div className="flex-1 space-y-0.5">
              <label className="text-xs text-muted-foreground">Closing time</label>
              <input type="time" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
            </div>
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
        <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} className="rounded" />
        Currently on view
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || uploading || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function ExhibitionsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const exhibitions = org.exhibitions || [];
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtsOrganization.update(org.id, { exhibitions: list });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const saveNew = async (form) => {
    setSaving(true);
    await save([...exhibitions, form]);
    setShowForm(false);
    setSaving(false);
  };

  const saveEdit = async (form) => {
    setSaving(true);
    await save(exhibitions.map((e, i) => i === editIdx ? { ...e, ...form } : e));
    setEditIdx(null);
    setSaving(false);
  };

  const remove = async (idx) => {
    if (!window.confirm('Remove this exhibition?')) return;
    await save(exhibitions.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editIdx === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Exhibition
          </Button>
        </div>
      )}
      {showForm && <ExhibitionForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}
      {exhibitions.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No exhibitions listed yet.</p>
      ) : (
        <div className="space-y-3">
          {exhibitions.map((ex, i) => (
            <div key={i}>
              {editIdx === i ? (
                <ExhibitionForm initial={ex} onSave={saveEdit} onCancel={() => setEditIdx(null)} saving={saving} />
              ) : (
                <div className="flex gap-3 p-4 bg-card border border-border rounded-xl">
                  {ex.image_url && (
                    <img src={ex.image_url} alt={ex.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="font-semibold text-foreground">{ex.title}</p>
                        {ex.is_current && <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">On view</span>}
                      </div>
                      {isOwner && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => setEditIdx(i)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                    {(ex.start_date || ex.end_date) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ex.start_date && format(new Date(ex.start_date), 'MMM d, yyyy')}
                        {ex.end_date && ` – ${format(new Date(ex.end_date), 'MMM d, yyyy')}`}
                        {(ex.start_time || ex.end_time) && (
                          <span className="ml-2">
                            · {ex.start_time && formatTime(ex.start_time)}{ex.end_time && ` – ${formatTime(ex.end_time)}`}
                          </span>
                        )}
                      </p>
                    )}
                    {!(ex.start_date || ex.end_date) && (ex.start_time || ex.end_time) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ex.start_time && formatTime(ex.start_time)}{ex.end_time && ` – ${formatTime(ex.end_time)}`}
                      </p>
                    )}
                    {ex.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ex.description}</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}