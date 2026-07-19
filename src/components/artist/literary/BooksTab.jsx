import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil, BookOpen, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FORMATS = ['print', 'ebook', 'audiobook', 'chapbook', 'zine'];
const RETAILERS = [
  { key: 'amazon', label: 'Amazon' },
  { key: 'bookshop', label: 'Bookshop.org' },
  { key: 'barnes_noble', label: 'B&N' },
  { key: 'indie', label: 'Indie' },
];

function BookForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || { title: '', subtitle: '', format: 'print', cover_url: '', blurb: '', release_date: '', isbn: '', publisher: '', buy_links: {} });
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef(null);

  const uploadImage = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, cover_url: file_url }));
    setUploading(false);
  };
  const setLink = (key, val) => setForm(f => ({ ...f, buy_links: { ...(f.buy_links || {}), [key]: val } }));

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex gap-3">
        <div className="w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden bg-secondary border border-border cursor-pointer flex items-center justify-center relative" onClick={() => imgRef.current?.click()}>
          {form.cover_url
            ? <img src={form.cover_url} alt="" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-1"><BookOpen className="w-6 h-6 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Cover</span></div>}
          {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        <div className="flex-1 space-y-2">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Subtitle (optional)" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))}>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Release date" type="date" value={form.release_date} onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Publisher" value={form.publisher} onChange={e => setForm(f => ({ ...f, publisher: e.target.value }))} />
            <input className="w-32 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="ISBN" value={form.isbn} onChange={e => setForm(f => ({ ...f, isbn: e.target.value }))} />
          </div>
        </div>
      </div>
      <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Blurb / description" value={form.blurb} onChange={e => setForm(f => ({ ...f, blurb: e.target.value }))} />
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">Buy links</p>
        {RETAILERS.map(r => (
          <input key={r.key} className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-sm" placeholder={`${r.label} URL`} value={form.buy_links?.[r.key] || ''} onChange={e => setLink(r.key, e.target.value)} />
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.title || uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">Save</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
    </div>
  );
}

function BookCard({ book, isOwner, onEdit, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
          {book.cover_url ? <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-muted-foreground/40" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">{book.title}</p>
              {book.subtitle && <p className="text-xs text-muted-foreground italic truncate">{book.subtitle}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium uppercase">{book.format}</span>
                {book.release_date && <span className="text-xs text-muted-foreground">{new Date(book.release_date).getFullYear()}</span>}
                {book.publisher && <span className="text-xs text-muted-foreground">· {book.publisher}</span>}
              </div>
            </div>
            {isOwner && (
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={onEdit} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>
          {book.blurb && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{book.blurb}</p>}
          {book.buy_links && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {RETAILERS.filter(r => book.buy_links[r.key]).map(r => (
                <a key={r.key} href={book.buy_links[r.key]} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded-full bg-secondary text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1">{r.label}<ExternalLink className="w-2.5 h-2.5" /></a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BooksTab({ artistId, isOwner }) {
  const queryClient = useQueryClient();
  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books', artistId],
    queryFn: () => base44.entities.Book.filter({ artist_id: artistId }, 'sort_order', 50),
    enabled: !!artistId,
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['books', artistId] });
  const saveNew = async (form) => { await base44.entities.Book.create({ ...form, artist_id: artistId }); setShowForm(false); refresh(); };
  const saveEdit = async (form) => { await base44.entities.Book.update(editing.id, form); setEditing(null); refresh(); };
  const del = async (book) => { if (!window.confirm('Remove this book?')) return; await base44.entities.Book.delete(book.id); refresh(); };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && !showForm && editing === null && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Add Book</Button>
        </div>
      )}
      {showForm && <BookForm onSave={saveNew} onCancel={() => setShowForm(false)} />}
      {books.length === 0 && !showForm
        ? <p className="text-center py-12 text-sm text-muted-foreground">No books published yet.</p>
        : <div className="space-y-3">{books.map(b => editing?.id === b.id ? <BookForm key={b.id} initial={b} onSave={saveEdit} onCancel={() => setEditing(null)} /> : <BookCard key={b.id} book={b} isOwner={isOwner} onEdit={() => setEditing(b)} onDelete={() => del(b)} />)}</div>}
    </div>
  );
}