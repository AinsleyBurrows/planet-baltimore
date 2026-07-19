import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMPTY = { name: '', description: '' };

function MaterialForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY);
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <input
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
        placeholder="Material or technique (e.g. Collage, Assemblage, Resin) *"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
      />
      <textarea
        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-y min-h-[72px]"
        placeholder="How you work with this material / technique"
        value={form.description}
        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(form)} disabled={saving || !form.name} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function MixedMediaMaterialsTab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const items = artist.materials_techniques || [];
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (list) => {
    await base44.entities.ArtistPage.update(artist.id, { materials_techniques: list });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  const saveNew = async (form) => { setSaving(true); await save([form, ...items]); setShowForm(false); setSaving(false); };
  const remove = async (idx) => { if (!window.confirm('Remove this entry?')) return; await save(items.filter((_, i) => i !== idx)); };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Add Material
          </Button>
        </div>
      )}
      {showForm && <MaterialForm onSave={saveNew} onCancel={() => setShowForm(false)} saving={saving} />}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Palette className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No materials or techniques listed yet.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((m, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-foreground">{m.name}</p>
                {isOwner && (
                  <button onClick={() => remove(i)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {m.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{m.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}