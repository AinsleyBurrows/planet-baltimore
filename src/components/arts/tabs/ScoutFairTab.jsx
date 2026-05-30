import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SECTIONS = [
  { key: 'curators',          label: 'Curators' },
  { key: 'artists',           label: 'Artists' },
  { key: 'galleries',         label: 'Galleries' },
  { key: 'sponsors',          label: 'Sponsors' },
  { key: 'arts_organizations', label: 'Arts Organizations' },
];

function EntryForm({ onAdd }) {
  const [name, setName]       = useState('');
  const [detail, setDetail]   = useState('');
  const [website, setWebsite] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), detail: detail.trim(), website: website.trim() });
    setName(''); setDetail(''); setWebsite('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 bg-secondary/50 rounded-xl border border-border">
      <Input
        placeholder="Name *"
        value={name}
        onChange={e => setName(e.target.value)}
        className="h-8 text-sm"
      />
      <Input
        placeholder="Description / Role (optional)"
        value={detail}
        onChange={e => setDetail(e.target.value)}
        className="h-8 text-sm"
      />
      <Input
        placeholder="Website URL (optional)"
        value={website}
        onChange={e => setWebsite(e.target.value)}
        className="h-8 text-sm"
      />
      <Button type="submit" size="sm" className="self-end h-8 px-4 text-xs">Add</Button>
    </form>
  );
}

function Section({ sectionKey, label, items = [], isOwner, onAdd, onRemove }) {
  const [open, setOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (entry) => {
    onAdd(sectionKey, entry);
    setShowForm(false);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/40 hover:bg-secondary/70 transition-colors"
      >
        <span className="font-semibold text-sm text-foreground">
          {label}
          {items.length > 0 && (
            <span className="ml-2 text-[11px] bg-accent/20 text-accent rounded-full px-1.5 py-0.5">{items.length}</span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {items.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-2">No {label.toLowerCase()} added yet.</p>
          )}

          {items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3 p-3 bg-secondary/30 rounded-lg">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
                {item.website && (
                  <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-0.5 block truncate">
                    {item.website.replace(/https?:\/\//, '')}
                  </a>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => onRemove(sectionKey, i)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {isOwner && (
            showForm ? (
              <>
                <EntryForm onAdd={handleAdd} />
                <button onClick={() => setShowForm(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              </>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />Add {label.slice(0, -1)}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function ScoutFairTab({ org, isOwner }) {
  const queryClient = useQueryClient();

  const scoutFair = org.hub_data?.scout_fair || {};

  const handleAdd = async (sectionKey, entry) => {
    const current = scoutFair[sectionKey] || [];
    const updated = {
      hub_data: {
        ...(org.hub_data || {}),
        scout_fair: {
          ...scoutFair,
          [sectionKey]: [...current, entry],
        },
      },
    };
    await base44.entities.ArtsOrganization.update(org.id, updated);
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  const handleRemove = async (sectionKey, index) => {
    const current = scoutFair[sectionKey] || [];
    const updated = {
      hub_data: {
        ...(org.hub_data || {}),
        scout_fair: {
          ...scoutFair,
          [sectionKey]: current.filter((_, i) => i !== index),
        },
      },
    };
    await base44.entities.ArtsOrganization.update(org.id, updated);
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
  };

  return (
    <div className="space-y-3">
      {SECTIONS.map(({ key, label }) => (
        <Section
          key={key}
          sectionKey={key}
          label={label}
          items={scoutFair[key] || []}
          isOwner={isOwner}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}