import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, X, Loader2, CheckCircle2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TYPES = [
  { value: 'poll', label: 'Poll' },
  { value: 'survey', label: 'Survey' },
  { value: 'vote', label: 'Formal Vote' },
];

export default function GovPublicInputTab({ agency, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: '', description: '', type: 'poll', options: ['', ''] });
  const [saving, setSaving] = useState(false);
  const [votedPolls, setVotedPolls] = useState({});

  const polls = agency.polls || [];

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, ''] }));
  const removeOption = (idx) => setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  const updateOption = (idx, val) => setForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? val : o) }));

  const save = async () => {
    if (!form.question.trim() || form.options.filter(o => o.trim()).length < 2) return;
    setSaving(true);
    const newPoll = {
      id: `poll_${Date.now()}`,
      question: form.question.trim(),
      description: form.description.trim(),
      type: form.type,
      options: form.options.filter(o => o.trim()).map(o => ({ text: o.trim(), votes: 0 })),
      status: 'open',
      created_at: new Date().toISOString(),
      closes_at: '',
    };
    await base44.entities.GovernmentAgency.update(agency.id, { polls: [...polls, newPoll] });
    setSaving(false);
    setShowForm(false);
    setForm({ question: '', description: '', type: 'poll', options: ['', ''] });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  const vote = async (pollId, optionIdx) => {
    if (votedPolls[pollId]) return;
    const next = polls.map(p => {
      if (p.id !== pollId) return p;
      return { ...p, options: p.options.map((o, i) => i === optionIdx ? { ...o, votes: o.votes + 1 } : o) };
    });
    await base44.entities.GovernmentAgency.update(agency.id, { polls: next });
    setVotedPolls(v => ({ ...v, [pollId]: optionIdx }));
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  const closePoll = async (pollId) => {
    const next = polls.map(p => p.id === pollId ? { ...p, status: 'closed' } : p);
    await base44.entities.GovernmentAgency.update(agency.id, { polls: next });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  const remove = async (pollId) => {
    if (!window.confirm('Remove this poll?')) return;
    const next = polls.filter(p => p.id !== pollId);
    await base44.entities.GovernmentAgency.update(agency.id, { polls: next });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agency.id] });
  };

  return (
    <div className="space-y-4">
      {isOwner && !showForm && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Create Poll / Survey</Button>
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm">New Poll / Survey</h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-secondary"><X className="w-4 h-4" /></button>
          </div>
          <input className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Question *" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
          <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none h-16" placeholder="Description / context (optional)" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <select className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Options (min 2)</p>
            {form.options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <input className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder={`Option ${idx + 1}`} value={opt} onChange={e => updateOption(idx, e.target.value)} />
                {form.options.length > 2 && <button onClick={() => removeOption(idx)} className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            <button onClick={addOption} className="text-xs text-accent hover:underline font-medium">+ Add option</button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={!form.question.trim() || form.options.filter(o => o.trim()).length < 2 || saving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Publish'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {polls.length === 0 && !showForm ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No polls or surveys yet.
        </div>
      ) : (
        <div className="space-y-3">
          {polls.slice().reverse().map(p => {
            const totalVotes = (p.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
            const hasVoted = votedPolls[p.id] !== undefined;
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium uppercase">{p.type}</span>
                      {p.status === 'open' ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Open</span> : <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">Closed</span>}
                    </div>
                    <p className="font-semibold text-foreground text-sm mt-1.5">{p.question}</p>
                    {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                  </div>
                  {isOwner && (
                    <div className="flex gap-1 flex-shrink-0">
                      {p.status === 'open' && <button onClick={() => closePoll(p.id)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>}
                      <button onClick={() => remove(p.id)} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
                <div className="space-y-2 mt-3">
                  {(p.options || []).map((o, idx) => {
                    const pct = totalVotes > 0 ? Math.round((o.votes || 0) / totalVotes * 100) : 0;
                    const isMyVote = votedPolls[p.id] === idx;
                    return (
                      <div key={idx}>
                        {p.status === 'open' && !hasVoted ? (
                          <button onClick={() => vote(p.id, idx)} className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-accent hover:bg-accent/5 text-sm text-foreground transition-colors">
                            {o.text}
                          </button>
                        ) : (
                          <div className="relative px-3 py-2 rounded-lg bg-secondary/50 overflow-hidden">
                            <div className="absolute inset-y-0 left-0 bg-accent/15 rounded-lg" style={{ width: `${pct}%` }} />
                            <div className="relative flex items-center justify-between">
                              <span className="text-sm text-foreground flex items-center gap-1.5">{isMyVote && <CheckCircle2 className="w-3.5 h-3.5 text-accent" />}{o.text}</span>
                              <span className="text-xs text-muted-foreground">{o.votes || 0} · {pct}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{totalVotes} total votes</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}