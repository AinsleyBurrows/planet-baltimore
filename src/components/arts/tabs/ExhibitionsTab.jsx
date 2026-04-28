import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Image as ImageIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function ExhibitionsTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const exhibitions = org.exhibitions || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', image_url: '', is_current: true });

  const save = async () => {
    setSaving(true);
    const updated = [...exhibitions, { ...form, id: Date.now().toString() }];
    await base44.entities.ArtsOrganization.update(org.id, { exhibitions: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setShowForm(false);
    setForm({ title: '', description: '', start_date: '', end_date: '', image_url: '', is_current: true });
    setSaving(false);
  };

  const remove = async (idx) => {
    const updated = exhibitions.filter((_, i) => i !== idx);
    await base44.entities.ArtsOrganization.update(org.id, { exhibitions: updated });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Exhibition
          </Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-20" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Start Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
            <div><label className="text-xs text-muted-foreground">End Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Image URL (optional)" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
            Currently on view
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !form.title} className="bg-accent hover:bg-accent/90 text-accent-foreground">{saving ? 'Saving…' : 'Save'}</Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {exhibitions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No exhibitions listed yet.
        </div>
      ) : (
        <div className="space-y-4">
          {exhibitions.map((ex, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
              {ex.image_url && <img src={ex.image_url} alt={ex.title} className="w-full h-44 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{ex.title}</h3>
                      {ex.is_current && <Badge className="bg-green-100 text-green-700 border-0 text-xs">On View</Badge>}
                    </div>
                    {(ex.start_date || ex.end_date) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {ex.start_date && format(new Date(ex.start_date), 'MMM d, yyyy')}
                        {ex.end_date && ` – ${format(new Date(ex.end_date), 'MMM d, yyyy')}`}
                      </p>
                    )}
                    {ex.description && <p className="text-sm text-muted-foreground mt-2">{ex.description}</p>}
                  </div>
                  {isOwner && (
                    <button onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}