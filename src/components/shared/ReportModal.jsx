import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetName }) {
  const { user } = useCurrentUser();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason || !user) return;
    setLoading(true);
    await base44.entities.Report.create({
      reporter_id: user.id,
      reporter_email: user.email,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName || '',
      reason,
      details: details.trim() || undefined,
      status: 'pending',
    });
    setLoading(false);
    setSubmitted(true);
  };

  const handleClose = () => {
    setReason('');
    setDetails('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            <h2 className="font-semibold text-sm">Report Content</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          {submitted ? (
            <div className="text-center py-4 space-y-2">
              <div className="text-3xl">✅</div>
              <p className="font-semibold text-sm">Report submitted</p>
              <p className="text-xs text-muted-foreground">Thank you. Our team will review this content.</p>
              <Button size="sm" variant="outline" className="mt-3 rounded-lg" onClick={handleClose}>Close</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Why are you reporting this?</p>
              <div className="space-y-1.5">
                {REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${reason === r.value ? 'border-destructive bg-destructive/5 text-destructive font-medium' : 'border-border hover:bg-secondary text-foreground'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {reason === 'other' && (
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Please describe the issue…"
                  className="w-full text-sm bg-secondary rounded-xl px-3 py-2 outline-none border border-transparent focus:border-ring placeholder:text-muted-foreground resize-none h-20"
                  maxLength={500}
                />
              )}
              <Button
                onClick={handleSubmit}
                disabled={!reason || loading}
                className="w-full rounded-lg text-sm"
                style={{ backgroundColor: '#d4580a' }}
              >
                {loading ? 'Submitting…' : 'Submit Report'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}