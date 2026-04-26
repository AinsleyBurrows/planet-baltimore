import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VotingModal({ associationId, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    voting_type: 'yes_no',
    options: ['Yes', 'No'],
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  const createVotingMutation = useMutation({
    mutationFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Voting.create({
        association_id: associationId,
        title: form.title,
        description: form.description,
        voting_type: form.voting_type,
        options: form.voting_type === 'yes_no' ? ['Yes', 'No'] : form.options,
        status: 'draft',
        start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
        created_by: currentUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['association-votings', associationId] });
      onSuccess();
    },
  });

  const handleAddOption = () => {
    setForm(f => ({ ...f, options: [...f.options, ''] }));
  };

  const handleRemoveOption = (idx) => {
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...form.options];
    newOptions[idx] = value;
    setForm(f => ({ ...f, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createVotingMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <h3 className="font-semibold text-foreground">Create Voting</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Issue Title *</label>
            <input
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="e.g., Should we host monthly community events?"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
              placeholder="Provide context for the vote…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Voting Type</label>
            <select
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={form.voting_type}
              onChange={e => setForm(f => ({ ...f, voting_type: e.target.value }))}
            >
              <option value="yes_no">Yes / No</option>
              <option value="multiple_choice">Multiple Choice</option>
            </select>
          </div>

          {form.voting_type === 'multiple_choice' && (
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Options</label>
              <div className="space-y-2">
                {form.options.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder={`Option ${idx + 1}`}
                      value={option}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                    />
                    {form.options.length > 2 && (
                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddOption}
                className="flex items-center gap-1.5 text-xs text-accent hover:underline mt-2 font-medium"
              >
                <Plus className="w-3 h-3" /> Add Option
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-3 border-t border-border flex-shrink-0 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.title.trim() || createVotingMutation.isPending}
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-2"
          >
            {createVotingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Voting'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}