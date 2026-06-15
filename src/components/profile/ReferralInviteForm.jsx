import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Link2, Copy, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

export default function ReferralInviteForm({ userId, referralCode }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('link'); // 'link' or 'email'

  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const sendInviteMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendReferralInvite', data),
    onSuccess: () => {
      setEmail('');
      setMessage('');
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    sendInviteMutation.mutate({ email, message });
  };

  return (
    <div className="space-y-4">
      {/* Tab Selection */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('link')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'link'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Link2 className="w-4 h-4 inline mr-2" />
          Share Link
        </button>
        <button
          onClick={() => setTab('email')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'email'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Email Invite
        </button>
      </div>

      {/* Link Tab */}
      {tab === 'link' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Share your referral link with friends. When they join using it, you'll both get credit.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-secondary text-sm text-foreground"
            />
            <Button
              onClick={handleCopyLink}
              size="sm"
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {tab === 'email' && (
        <form onSubmit={handleSendEmail} className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <Input
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Personal Message (optional)</label>
            <Textarea
              placeholder="Tell them why you think they'd love Planet Baltimore..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <Button
            type="submit"
            disabled={!email || sendInviteMutation.isPending}
            className="w-full"
          >
            {sendInviteMutation.isPending ? 'Sending...' : 'Send Invite'}
          </Button>
          {sendInviteMutation.isSuccess && (
            <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
              Invite sent successfully!
            </p>
          )}
          {sendInviteMutation.isError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
              Failed to send invite. Try again.
            </p>
          )}
        </form>
      )}
    </div>
  );
}