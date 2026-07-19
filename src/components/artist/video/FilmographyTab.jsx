import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const GENRES = [
  { value: 'feature', label: 'Feature' },
  { value: 'short_film', label: 'Short Film' },
  { value: 'documentary', label: 'Documentary' },
  { value: 'music_video', label: 'Music Video' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'series', label: 'Series' },
  { value: 'experimental', label: 'Experimental' },
  { value: 'other', label: 'Other' },
];

const getEmbedUrl = (url) => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
};

function ProjectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', role: '', year: '', runtime: '', genre: 'short_film', synopsis: '', poster_url: '', trailer_url: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const uploadPoster = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, poster_url: file_url }));
    setUploading(false);
  };

  const field = (key, ph) => (
    <input className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder={ph} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
  );

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <div className="flex gap-2">
        {field('role', 'Role (e.g. Director)')}
        {field('year', 'Year')}
        {field('runtime', 'Runtime (e.g. 12 min)')}
      </div>
      <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}>
        {GENRES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
      </select>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Synopsis (optional)" value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} />
      <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Trailer YouTube / Vimeo URL (optional)" value={form.trailer_url} onChange={e => setForm(f => ({ ...f, trailer_url: e.target.value }))} />
      <div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}{uploading ? 'Uploading…' : form.poster_url ? 'Replace Poster' : 'Add Poster'}
        </button>
        {form.poster_url && <img src={form.poster_url} alt="poster" className="w-16 h-24 object-cover rounded-lg mt-2" />}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ ...form, trailer_url: form.trailer_url ? getEmbedUrl(form.trailer_url) : '' })} disabled={!form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadPoster(e.target.files[0])} />
    </div>
  );
}

function ProjectCard({ project, isOwner, onEdit, onDelete }) {
  const [playing, setPlaying] = useState(false);
  const genreLabel = GENRES.find(g => g.value === project.genre)?.label || project.genre;
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {project.poster_url && (
        <div className="relative aspect-video bg-secondary cursor-pointer" onClick={() => project.trailer_url && setPlaying(p => !p)}>
          {playing && project.trailer_url
            ? <iframe src={project.trailer_url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={project.title} />
            : <>
              <img src={project.poster_url} alt={project.title} className="w-full h-full object-cover" />
              {project.trailer_url && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center"><Play className="w-5 h-5 text-accent-foreground ml-0.5" /></div>
                </div>
              )}
            </>
          }
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{project.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {project.role && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{project.role}</span>}
              {genreLabel && <span className="text-xs text-muted-foreground">{genreLabel}</span>}
              {project.year && <span className="text-xs text-muted-foreground">· {project.year}</span>}
              {project.runtime && <span className="text-xs text-muted-foreground">· {project.runtime}</span>}
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        {project.synopsis && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{project.synopsis}</p>}
      </div>
    </div>
  );
}

export default function FilmographyTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['video-projects', artistId],
    queryFn: () => base44.entities.VideoProject.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['video-projects', artistId] });
  const saveNew = async (form) => { await base44.entities.VideoProject.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.VideoProject.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (p) => { if (!window.confirm('Remove this project?')) return; await base44.entities.VideoProject.delete(p.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Project</Button>
        </div>
      )}
      {showForm && <ProjectForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {projects.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No films or projects added yet.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{projects.map(p => editing?.id === p.id ? <ProjectForm key={p.id} initial={p} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <ProjectCard key={p.id} project={p} isOwner={isOwner} onEdit={() => setEditing(p)} onDelete={() => del(p)} />)}</div>}
    </div>
  );
}