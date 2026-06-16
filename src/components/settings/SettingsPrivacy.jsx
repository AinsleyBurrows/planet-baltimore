import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Trash2, Download, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsPrivacy({ user }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    // Mark account for deletion — in a real system this would trigger a backend process
    await base44.auth.updateMe({ account_delete_requested: true });
    toast({ title: 'Deletion request submitted', description: 'Our team will process your request within 7 days.' });
    setDeleting(false);
    setConfirmText('');
  };

  return (
    <div className="space-y-4">
      {/* Visibility info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-foreground">Profile Visibility</h2>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            <p>Your profile is <strong className="text-foreground">public</strong> — any Planet Baltimore member can view your posts and profile.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            <p>Your email address is <strong className="text-foreground">never visible</strong> to other members.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
            <p>Block or report users from their profile page at any time.</p>
          </div>
        </div>
      </div>

      {/* Data export */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-foreground">Your Data</h2>
        </div>
        <p className="text-sm text-muted-foreground">Request a copy of all your posts, comments, and activity on Planet Baltimore.</p>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg"
          onClick={() => toast({ title: 'Export requested', description: 'We\'ll email you a download link within 24 hours.' })}
        >
          <Download className="w-4 h-4 mr-1.5" />
          Request Data Export
        </Button>
      </div>

      {/* Delete account */}
      <div className="bg-card border border-destructive/30 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="font-semibold text-destructive">Delete Account</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated content. This action <strong className="text-foreground">cannot be undone</strong>.
        </p>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Type <strong className="text-foreground font-mono">DELETE</strong> to confirm:</p>
          <input
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-destructive font-mono"
          />
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={confirmText !== 'DELETE' || deleting}
          onClick={handleDeleteAccount}
          className="rounded-lg"
        >
          <Trash2 className="w-4 h-4 mr-1.5" />
          {deleting ? 'Processing…' : 'Delete My Account'}
        </Button>
      </div>
    </div>
  );
}