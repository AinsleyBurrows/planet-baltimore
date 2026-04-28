import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BarChart2, Save, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

const emptyProgram = { name: '', description: '', people_served: '', outcomes: '' };
const emptyStat = { label: '', value: '', year: new Date().getFullYear().toString() };

export default function ImpactTab({ org, isOwner }) {
  const queryClient = useQueryClient();
  const impact = org.impact || { programs: [], stats: [], annual_report_url: '' };
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(impact);
  const [newProgram, setNewProgram] = useState(emptyProgram);
  const [newStat, setNewStat] = useState(emptyStat);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showStatForm, setShowStatForm] = useState(false);

  const save = async () => {
    setSaving(true);
    await base44.entities.ArtsOrganization.update(org.id, { impact: form });
    queryClient.invalidateQueries({ queryKey: ['arts-org', org.id] });
    setEditing(false);
    setSaving(false);
  };

  const addProgram = () => {
    if (!newProgram.name) return;
    setForm(f => ({ ...f, programs: [...(f.programs || []), { ...newProgram }] }));
    setNewProgram(emptyProgram);
    setShowProgramForm(false);
  };

  const addStat = () => {
    if (!newStat.label || !newStat.value) return;
    setForm(f => ({ ...f, stats: [...(f.stats || []), { ...newStat }] }));
    setNewStat(emptyStat);
    setShowStatForm(false);
  };

  const display = editing ? form : impact;

  return (
    <div className="space-y-5">
      {isOwner && (
        <div className="flex justify-end gap-2">
          {editing ? (
            <>
              <Button size="sm" onClick={save} disabled={saving} className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5"><Save className="w-3.5 h-3.5" />{saving ? 'Saving…' : 'Save All'}</Button>
              <Button size="sm" variant="outline" onClick={() => { setForm(impact); setEditing(false); }}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => { setForm(impact); setEditing(true); }} className="gap-1.5"><BarChart2 className="w-3.5 h-3.5" />Edit Impact</Button>
          )}
        </div>
      )}

      {/* Key Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Impact Stats</p>
          {editing && <button onClick={() => setShowStatForm(v => !v)} className="text-xs text-accent hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Stat</button>}
        </div>
        {editing && showStatForm && (
          <div className="bg-secondary/50 rounded-xl p-3 space-y-2 mb-3">
            <div className="grid grid-cols-3 gap-2">
              <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm col-span-1" placeholder="Value (e.g. 1,200)" value={newStat.value} onChange={e => setNewStat(s => ({ ...s, value: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm col-span-1" placeholder="Label (e.g. Artists Supported)" value={newStat.label} onChange={e => setNewStat(s => ({ ...s, label: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Year" value={newStat.year} onChange={e => setNewStat(s => ({ ...s, year: e.target.value }))} />
            </div>
            <Button size="sm" onClick={addStat} className="bg-accent hover:bg-accent/90 text-accent-foreground">Add</Button>
          </div>
        )}
        {(display.stats || []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No stats added yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(display.stats || []).map((s, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 text-center relative group">
                <p className="text-2xl font-extrabold text-accent">{s.value}</p>
                <p className="text-xs text-foreground font-medium mt-1">{s.label}</p>
                {s.year && <p className="text-xs text-muted-foreground">{s.year}</p>}
                {editing && <button onClick={() => setForm(f => ({ ...f, stats: f.stats.filter((_, j) => j !== i) }))} className="absolute top-1.5 right-1.5 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Programs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Programs</p>
          {editing && <button onClick={() => setShowProgramForm(v => !v)} className="text-xs text-accent hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />Add Program</button>}
        </div>
        {editing && showProgramForm && (
          <div className="bg-secondary/50 rounded-xl p-3 space-y-2 mb-3">
            <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Program Name *" value={newProgram.name} onChange={e => setNewProgram(p => ({ ...p, name: e.target.value }))} />
            <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description" value={newProgram.description} onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="People Served" value={newProgram.people_served} onChange={e => setNewProgram(p => ({ ...p, people_served: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Key Outcomes" value={newProgram.outcomes} onChange={e => setNewProgram(p => ({ ...p, outcomes: e.target.value }))} />
            </div>
            <Button size="sm" onClick={addProgram} className="bg-accent hover:bg-accent/90 text-accent-foreground">Add</Button>
          </div>
        )}
        {(display.programs || []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No programs listed yet.</p>
        ) : (
          <div className="space-y-3">
            {(display.programs || []).map((prog, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 relative group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{prog.name}</p>
                    {prog.description && <p className="text-sm text-muted-foreground mt-1">{prog.description}</p>}
                    <div className="flex gap-4 mt-2 flex-wrap">
                      {prog.people_served && <span className="flex items-center gap-1 text-xs font-medium text-accent"><Users className="w-3 h-3" />{prog.people_served} served</span>}
                      {prog.outcomes && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Target className="w-3 h-3" />{prog.outcomes}</span>}
                    </div>
                  </div>
                  {editing && <button onClick={() => setForm(f => ({ ...f, programs: f.programs.filter((_, j) => j !== i) }))} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Annual Report URL */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Annual Report</p>
        {editing ? (
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Annual Report URL (PDF or link)" value={form.annual_report_url || ''} onChange={e => setForm(f => ({ ...f, annual_report_url: e.target.value }))} />
        ) : display.annual_report_url ? (
          <a href={display.annual_report_url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline flex items-center gap-1.5">View Annual Report →</a>
        ) : (
          <p className="text-sm text-muted-foreground">No annual report linked yet.</p>
        )}
      </div>
    </div>
  );
}