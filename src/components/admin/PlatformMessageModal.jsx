import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function PlatformMessageModal({ open, onClose }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('messagePlatformUsers', { subject, body });
      setResult({ success: true, ...res.data });
      setSubject('');
      setBody('');
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSubject('');
    setBody('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-accent" />
            Message All Platform Members
          </DialogTitle>
          <DialogDescription>
            This will send an email to every registered user on Planet Baltimore.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className={`rounded-xl p-5 text-center ${result.success ? 'bg-green-50 dark:bg-green-950/30' : 'bg-destructive/10'}`}>
            {result.success ? (
              <>
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-foreground">Message sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Delivered to {result.successCount} of {result.total} members.
                  {result.failureCount > 0 && ` (${result.failureCount} failed)`}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                <p className="font-semibold text-foreground">Failed to send</p>
                <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
              </>
            )}
            <Button variant="outline" className="mt-4" onClick={handleClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Important update from Planet Baltimore"
                className="bg-secondary/50 border-0 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your message here..."
                rows={6}
                className="bg-secondary/50 border-0 rounded-xl resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleSend}
                disabled={loading || !subject.trim() || !body.trim()}
                className="gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Sending...' : 'Send to All Members'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}