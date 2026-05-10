import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Link as LinkIcon, FileText, ExternalLink, Upload, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const TYPES = ['link', 'doc', 'video', 'other'];

const FILE_ICONS = {
  doc: '📄', pdf: '📕', xls: '📊', ppt: '📊', zip: '🗜️', img: '🖼️', vid: '🎬', default: '📎'
};

function getFileIcon(filename) {
  if (!filename) return FILE_ICONS.default;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return FILE_ICONS.pdf;
  if (['doc','docx','txt','rtf'].includes(ext)) return FILE_ICONS.doc;
  if (['xls','xlsx','csv'].includes(ext)) return FILE_ICONS.xls;
  if (['ppt','pptx'].includes(ext)) return FILE_ICONS.ppt;
  if (['zip','rar','7z'].includes(ext)) return FILE_ICONS.zip;
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return FILE_ICONS.img;
  if (['mp4','mov','webm'].includes(ext)) return FILE_ICONS.vid;
  return FILE_ICONS.default;
}

export default function CommunityResourcesTab({ community, isOwner }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const resources = community.hub_data?.resources || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', url: '', description: '', type: 'link', filename: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const saveAll = async (list) => {
    await base44.entities.Community.update(community.id, {
      hub_data: { ...(community.hub_data || {}), resources: list }
    });
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, url: file_url, filename: file.name, title: f.title || file.name, type: 'doc' }));
    setUploading(false);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    await saveAll([...resources, { ...form, created_at: new Date().toISOString() }]);
    setForm({ title: '', url: '', description: '', type: 'link', filename: '' });
    setShowForm(false); setSaving(false);
  };

  const handleDelete = async (idx) => {
    if (!window.confirm('Remove this resource?')) return;
    await saveAll(resources.filter((_, i) => i !== idx));
  };

  const typeIcon = (r) => r.filename ? <span className="text-base leading-none">{getFileIcon(r.filename)}</span> : r.type === 'doc' ? <FileText className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Resource
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {/* Upload file OR paste URL */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-xs font-medium transition-colors"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading…' : form.filename ? `✓ ${form.filename}` : 'Upload file / doc'}
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files[0] && handleFileUpload(e.target.files[0])} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="flex-1 border-t border-border" />or paste a URL<span className="flex-1 border-t border-border" /></div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="https://…" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value, filename: '' }))} />

          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Short description (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || uploading || !form.title.trim() || !form.url.trim()} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Add'}</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setForm({ title: '', url: '', description: '', type: 'link', filename: '' }); }}>Cancel</Button>
          </div>
        </div>
      )}

      {resources.length === 0 && !showForm ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No resources shared yet.</p>
      ) : (
        <div className="space-y-2">
          {resources.map((r, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 text-accent">
                {typeIcon(r)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground text-sm truncate">{r.title}</p>
                  <Badge variant="outline" className="text-xs capitalize flex-shrink-0">{r.type}</Badge>
                </div>
                {r.filename && <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.filename}</p>}
                {r.description && <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>}
                <a href={r.url} target="_blank" rel="noopener noreferrer" download={r.filename || undefined}
                  className="text-xs text-accent hover:underline flex items-center gap-1 mt-1">
                  {r.filename ? <><Download className="w-3 h-3" /> Download</> : <><ExternalLink className="w-3 h-3" /> Open link</>}
                </a>
              </div>
              {isOwner && (
                <button onClick={() => handleDelete(i)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}