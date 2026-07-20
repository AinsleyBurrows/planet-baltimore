import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  GraduationCap, Film, Calendar, Briefcase, Handshake, Trophy, Newspaper, Radio,
  Plus, Trash2, Save, Loader2, Edit3, X, FileDown, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { key: 'education', label: 'Education & Training', icon: GraduationCap, fields: ['year', 'degree', 'institution'], primary: 'degree', secondary: ['institution'] },
  { key: 'filmography', label: 'Selected Filmography', icon: Film, fields: ['year', 'title', 'role'], primary: 'title', secondary: ['role'] },
  { key: 'screenings', label: 'Festivals & Screenings', icon: Calendar, fields: ['year', 'title', 'venue', 'location'], primary: 'title', secondary: ['venue', 'location'] },
  { key: 'commissions', label: 'Commissions & Clients', icon: Briefcase, fields: ['year', 'title', 'client'], primary: 'title', secondary: ['client'] },
  { key: 'collaborations', label: 'Collaborations', icon: Handshake, fields: ['year', 'title', 'partner'], primary: 'title', secondary: ['partner'] },
  { key: 'awards', label: 'Awards & Selections', icon: Trophy, fields: ['year', 'title', 'organization'], primary: 'title', secondary: ['organization'] },
  { key: 'press', label: 'Press & Reviews', icon: Newspaper, fields: ['year', 'title', 'publication', 'url'], primary: 'title', secondary: ['publication'], link: 'url' },
  { key: 'residencies', label: 'Residencies & Labs', icon: Radio, fields: ['year', 'program', 'location'], primary: 'program', secondary: ['location'] },
];

const FIELD_PLACEHOLDERS = {
  year: 'Year',
  degree: 'BFA Film / Video',
  institution: 'MICA, NYU Tisch, USC…',
  title: 'Project / Film title',
  role: 'Director, DP, Editor…',
  venue: 'Festival / Venue',
  location: 'City, Country',
  client: 'Client / Brand',
  partner: 'Collaborator / Production',
  organization: 'Festival, Academy…',
  program: 'Residency / Lab',
  publication: 'IndieWire, Variety…',
  url: 'https://…'
};

function CVSection({ section, items = [], isOwner, onAdd, onEdit, onRemove }) {
  const Icon = section.icon;
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          <span className="font-semibold text-sm text-foreground">{section.label}</span>
          {items.length > 0 && <span className="text-xs text-muted-foreground">({items.length})</span>}
        </div>
        <span className="text-muted-foreground text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No entries yet.</p>
          ) : (
            items.map((item, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="flex-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  {item.year && <span className="text-xs font-bold text-muted-foreground w-12 flex-shrink-0 mt-0.5">{item.year}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">{item[section.primary]}</p>
                    {section.secondary && <p className="text-xs text-muted-foreground">{section.secondary.map(f => item[f]).filter(Boolean).join(' · ')}</p>}
                    {section.link && item[section.link] && (
                      <a href={item[section.link]} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex items-center gap-1 mt-0.5">
                        <ExternalLink className="w-3 h-3" />Read more
                      </a>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 flex-shrink-0 transition-all">
                    <button onClick={() => onEdit(section.key, i, item, section.fields)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onRemove(section.key, i)} className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
          {isOwner && (
            <button onClick={() => onAdd(section.key, section.fields)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors pt-1">
              <Plus className="w-3.5 h-3.5" />Add entry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EntryModal({ fields, initialData, onSave, onClose }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialData || Object.fromEntries(fields.map(f => [f, ''])));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-5 space-y-4 m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{isEdit ? 'Edit entry' : 'Add entry'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        {fields.map(field => (
          <input key={field} className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={FIELD_PLACEHOLDERS[field] || field} value={form[field] || ''} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} />
        ))}
        <Button onClick={() => onSave(form)} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
          {isEdit ? 'Save changes' : 'Add'}
        </Button>
      </motion.div>
    </div>
  );
}

const EMPTY = {
  artist_statement: '',
  education: [], filmography: [], screenings: [], commissions: [],
  collaborations: [], awards: [], press: [], residencies: []
};

export default function VideoCVTab({ artistId, isOwner, ownerId }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [addingTo, setAddingTo] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [cvData, setCvData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: cv, isLoading } = useQuery({
    queryKey: ['artist-cv', artistId],
    queryFn: async () => {
      const results = await base44.entities.ArtistCV.filter({ artist_id: artistId });
      return results[0] || null;
    },
    enabled: !!artistId,
  });

  useEffect(() => { if (cv && !cvData) setCvData(cv); }, [cv]);

  const currentCV = cvData || cv || EMPTY;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (cv?.id) return base44.entities.ArtistCV.update(cv.id, data);
      return base44.entities.ArtistCV.create({ ...data, artist_id: artistId, owner_id: ownerId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['artist-cv', artistId] }); setEditing(false); setSaving(false); },
  });

  const handleSave = async () => {
    setSaving(true);
    let pdfUrl = currentCV.cv_pdf_url;
    if (pdfFile) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });
      pdfUrl = file_url;
    }
    saveMutation.mutate({ ...currentCV, cv_pdf_url: pdfUrl });
  };

  const handleAdd = (sectionKey, entry) => {
    setCvData(prev => { const base = prev || currentCV; return { ...base, [sectionKey]: [...(base[sectionKey] || []), entry] }; });
    setAddingTo(null);
  };
  const handleRemove = (sectionKey, idx) => {
    setCvData(prev => { const base = prev || currentCV; return { ...base, [sectionKey]: (base[sectionKey] || []).filter((_, i) => i !== idx) }; });
  };
  const handleSaveEdit = (sectionKey, updatedEntry) => {
    setCvData(prev => {
      const base = prev || currentCV;
      const updated = [...(base[sectionKey] || [])];
      updated[editingEntry.index] = updatedEntry;
      return { ...base, [sectionKey]: updated };
    });
    setEditingEntry(null);
  };

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground">Videographer CV / Bio</h2>
        <div className="flex gap-2">
          {currentCV.cv_pdf_url && (
            <a href={currentCV.cv_pdf_url} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="rounded-lg gap-1.5 text-xs"><FileDown className="w-3.5 h-3.5" />Download CV</Button>
            </a>
          )}
          {isOwner && !editing && (
            <Button size="sm" onClick={() => { setCvData(cv || currentCV); setEditing(true); }} variant="outline" className="rounded-lg gap-1.5 text-xs">
              <Edit3 className="w-3.5 h-3.5" />Edit CV
            </Button>
          )}
          {isOwner && editing && (
            <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-lg gap-1.5 text-xs bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : <><Save className="w-3.5 h-3.5" />Save CV</>}
            </Button>
          )}
        </div>
      </div>

      {/* Artist Statement */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Artist Statement</p>
        {editing ? (
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[120px]"
            placeholder="Write your artist statement / approach to filmmaking…"
            value={cvData?.artist_statement || ''}
            onChange={e => setCvData(p => ({ ...p, artist_statement: e.target.value }))} />
        ) : (
          <p className="text-sm text-foreground leading-relaxed">{currentCV.artist_statement || <span className="text-muted-foreground italic">No statement yet.</span>}</p>
        )}
      </div>

      {/* PDF Upload (editing only) */}
      {editing && (
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Upload CV / Reel List as PDF</p>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-accent transition-colors">
            <FileDown className="w-4 h-4" />
            {pdfFile ? pdfFile.name : currentCV.cv_pdf_url ? 'Replace PDF' : 'Upload PDF'}
            <input type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files[0])} />
          </label>
        </div>
      )}

      {/* CV Sections */}
      {SECTIONS.map(section => (
        <CVSection key={section.key} section={section} items={currentCV[section.key] || []}
          isOwner={isOwner && editing}
          onAdd={(key, fields) => setAddingTo({ sectionKey: key, fields })}
          onEdit={(key, idx, data, fields) => setEditingEntry({ sectionKey: key, index: idx, data, fields })}
          onRemove={handleRemove}
        />
      ))}

      <AnimatePresence>
        {addingTo && <EntryModal fields={addingTo.fields} onSave={(entry) => handleAdd(addingTo.sectionKey, entry)} onClose={() => setAddingTo(null)} />}
        {editingEntry && <EntryModal fields={editingEntry.fields} initialData={editingEntry.data} onSave={(entry) => handleSaveEdit(editingEntry.sectionKey, entry)} onClose={() => setEditingEntry(null)} />}
      </AnimatePresence>
    </div>
  );
}