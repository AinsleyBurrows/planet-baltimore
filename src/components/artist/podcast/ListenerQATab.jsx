import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, HelpCircle, Loader2, Check, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

function QuestionForm({ artist, onSubmit, sending }) {
  const [form, setForm] = useState({ listener_name: '', question: '' });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };
  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-sm text-foreground">Ask a Question</h3>
      <p className="text-xs text-muted-foreground">Your question may be answered on a future episode of {artist.name}.</p>
      <input required placeholder="Your name (or handle)" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm" value={form.listener_name} onChange={e => setForm(p => ({ ...p, listener_name: e.target.value }))} />
      <textarea required placeholder="What's your question?" className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none min-h-[90px]" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} />
      <Button type="submit" size="sm" disabled={sending} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg">{sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Submit Question</Button>
    </form>
  );
}

function QuestionCard({ q, isOwner, onToggleAnswered, onDelete }) {
  return (
    <div className={`bg-card border rounded-xl p-4 ${q.answered ? 'border-green-500/40' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0"><HelpCircle className="w-4 h-4 text-accent" /></div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{q.listener_name || 'Anonymous'}</p>
            {q.submitted_at && <p className="text-[10px] text-muted-foreground">{new Date(q.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {q.answered && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 flex items-center gap-0.5"><Check className="w-3 h-3" />Answered</span>}
          {isOwner && (
            <>
              {!q.answered && <button onClick={onToggleAnswered} title="Mark answered" className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-green-600"><Check className="w-3.5 h-3.5" /></button>}
              <button onClick={onDelete} className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </div>
      <p className="text-sm text-foreground mt-2 leading-relaxed">{q.question}</p>
      {q.episode_title && <p className="text-xs text-accent mt-1.5">↳ Answered in: {q.episode_title}</p>}
    </div>
  );
}

export default function ListenerQATab({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const questions = artist.podcast_questions || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });

  const submit = async (form) => {
    setSending(true);
    const entry = { ...form, submitted_at: new Date().toISOString(), answered: false, episode_title: '' };
    await base44.entities.ArtistPage.update(artist.id, { podcast_questions: [entry, ...questions] });
    setSending(false); setShowForm(false); setSubmitted(true); refresh();
    setTimeout(() => setSubmitted(false), 3500);
  };

  const toggleAnswered = async (idx) => {
    const updated = questions.map((q, i) => i === idx ? { ...q, answered: !q.answered } : q);
    await base44.entities.ArtistPage.update(artist.id, { podcast_questions: updated });
    refresh();
  };

  const del = async (idx) => {
    if (!window.confirm('Remove this question?')) return;
    const updated = questions.filter((_, i) => i !== idx);
    await base44.entities.ArtistPage.update(artist.id, { podcast_questions: updated });
    refresh();
  };

  const answeredCount = questions.filter(q => q.answered).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{questions.length} question{questions.length !== 1 ? 's' : ''} · {answeredCount} answered</p>
        {!isOwner && !showForm && <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-xs"><Plus className="w-3.5 h-3.5" /> Ask</Button>}
      </div>

      {submitted && <p className="text-sm text-green-600 bg-green-500/10 rounded-lg px-3 py-2">✓ Thanks! Your question has been submitted.</p>}

      {showForm && <QuestionForm artist={artist} onSubmit={submit} sending={sending} />}

      {questions.length === 0 && !showForm
        ? <div className="text-center py-12"><div className="w-14 h-14 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-3"><MessageCircleQuestion className="w-6 h-6 text-accent" /></div><p className="text-sm text-muted-foreground">No questions yet. Be the first to ask!</p></div>
        : <div className="space-y-2">{questions.map((q, i) => <QuestionCard key={i} q={q} isOwner={isOwner} onToggleAnswered={() => toggleAnswered(i)} onDelete={() => del(i)} />)}</div>}
    </div>
  );
}