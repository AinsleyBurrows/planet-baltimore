import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Download, FileText, Loader2, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Meeting Minutes', 'Budget & Finance', 'Forms & Applications', 'Public Records', 'Ordinances & Laws', 'Annual Reports', 'Other'];
const EMPTY = { title: '', description: '', category: 'Forms & Applications', file_url: '', posted_at: '' };

export default function GovDocumentsTab({ agency, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const documents = agency.documents || [];

  const openNew = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (idx) => { setForm(documents[idx]); setEditing(idx); setShowForm(true); };

  const uploadFile = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const next = [...documents];
    const entry = { ...form, posted_at: form.posted_at || new Date().toISOString() };
    if (editing !== null) next[editing] = entry;
    else next.push(entry);
    await base44.entities.GovernmentAgency.update(agency.id, { documents: next });
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  const remove = async (idx) => {
    if (!window.confirm('Remove this document?')) return;
    const next = documents.filter((_, i) => i !== idx);
    await base44.entities.GovernmentAgency.update(agency.id, { documents: next });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={openNew} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Document</Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">{editing !== null ? 'Edit Document' : 'Upload Document'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Document title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-accent text-sm text-muted-foreground hover:text-accent transition-colors flex-1">
              <Upload className="w-4 h-4" /> {form.file_url ? 'File attached ✓' : uploading ? 'Uploading…' : 'Upload PDF / file'}
            </button>
            <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files[0] && uploadFile(e.target.files[0])} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={!form.title.trim() || saving || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {documents.length === 0 && !showForm ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No documents posted yet.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((d, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.category}{d.posted_at && ` · ${new Date(d.posted_at).toLocaleDateString()}`}</p>
              </div>
              {isOwner && (
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(idx)} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(idx)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {d.file_url && (
                <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-secondary text-accent" aria-label="Download"><Download className="w-4 h-4" /></a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}