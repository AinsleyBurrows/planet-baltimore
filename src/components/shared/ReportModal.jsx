import React, { useState } from 'react';
import { Flag, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetName }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    const user = await base44.auth.me().catch(() => null);
    await base44.entities.Report.create({
      reporter_id: user?.id || 'anonymous',
      reporter_email: user?.email || '',
      target_type: targetType,
      target_id: targetId,
      target_name: targetName || '',
      reason,
      details,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={handleClose}>
      <div className="bg-card rounded-xl border border-border w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            <h3 className="font-semibold text-foreground">Report Content</h3>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <p className="font-medium text-foreground">Thank you for your report.</p>
            <p className="text-sm text-muted-foreground mt-1">Our team will review it shortly.</p>
            <Button className="mt-4 w-full" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">Why are you reporting this content?</p>
            <div className="space-y-2 mb-4">
              {REASONS.map(r => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${reason === r.value ? 'border-destructive bg-destructive/10 text-destructive font-medium' : 'border-border hover:bg-secondary text-foreground'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={e => setDetails(e.target.value)}
              rows={2}
              className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring mb-4"
            />
            <Button
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={!reason || loading}
              onClick={handleSubmit}
            >
              {loading ? 'Submitting…' : 'Submit Report'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}