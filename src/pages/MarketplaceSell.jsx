import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Upload, DollarSign, Tag, Image, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['music', 'art', 'photography', 'writing', 'video', 'design', 'other'];

export default function MarketplaceSell() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', price: '', tags: '', is_free: false });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [digitalFile, setDigitalFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { base44.auth.me().then(setUser).catch(() => navigate('/marketplace')); }, []);

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || (!form.is_free && !form.price)) return;
    setSaving(true);

    let cover_image = '';
    let file_url = '';

    if (coverFile) {
      const res = await base44.integrations.Core.UploadFile({ file: coverFile });
      cover_image = res.file_url;
    }
    if (digitalFile) {
      const res = await base44.integrations.Core.UploadFile({ file: digitalFile });
      file_url = res.file_url;
    }

    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const price = form.is_free ? 0 : parseFloat(form.price) || 0;

    await base44.entities.MarketplaceListing.create({
      seller_id: user.id,
      seller_name: user.full_name,
      seller_avatar: user.avatar_url,
      title: form.title,
      description: form.description,
      category: form.category,
      price,
      is_free: form.is_free || price === 0,
      cover_image,
      file_url,
      tags,
      is_active: true,
    });

    navigate('/marketplace');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Create a Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-xl p-6">
        {/* Cover image */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Cover Image</label>
          <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-accent transition-colors overflow-hidden">
            {coverPreview ? (
              <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Image className="w-8 h-8 opacity-40" />
                <span className="text-sm">Upload cover image</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Title *</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="My Digital Product"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what buyers will receive…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize"
          >
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Pricing</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="rounded" />
            <span className="text-muted-foreground">This is free</span>
          </label>
          {!form.is_free && (
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                min="0.50"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="9.99"
                required={!form.is_free}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags (comma-separated)</label>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="beat, instrumental, lo-fi"
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Digital file */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Digital File (uploaded on purchase)</label>
          <label className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed border-input cursor-pointer hover:border-accent transition-colors">
            <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">
              {digitalFile ? digitalFile.name : 'Upload file (PDF, ZIP, MP3, PNG…)'}
            </span>
            <input type="file" className="hidden" onChange={(e) => setDigitalFile(e.target.files[0])} />
          </label>
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing…</> : 'Publish Listing'}
        </Button>
      </form>
    </div>
  );
}