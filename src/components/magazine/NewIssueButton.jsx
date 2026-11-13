import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { generateIssue } from '@/lib/magazineIssue';

export default function NewIssueButton({ magazine, user }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState('');
  const [working, setWorking] = useState(false);

  const run = async () => {
    if (working) return;
    setWorking(true);
    try {
      const record = await generateIssue(magazine, user, setStep);
      setStep('');
      setWorking(false);
      navigate(`/magazines/${record.id}/edit`);
    } catch (error) {
      setStep('');
      setWorking(false);
      toast({
        variant: 'destructive',
        title: 'The new issue could not be written',
        description: error?.message || 'Something went wrong on the way. Try again in a moment.',
      });
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={run}
        disabled={working}
        className="h-9 gap-1.5 rounded-lg text-xs"
      >
        {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        New issue
      </Button>

      {working && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-2xl">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
            <p className="mt-3 font-serif text-lg font-bold">{step || 'Writing the issue'}…</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              A whole new issue of {magazine.title} is being written, photographed and laid out. This takes about a
              minute — you can keep this window open.
            </p>
          </div>
        </div>
      )}
    </>
  );
}