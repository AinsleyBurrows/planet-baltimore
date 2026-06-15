import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Settings as SettingsIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdminSettings() {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState('all');

  const sendMassMessageMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('sendMassMessage', {
        subject,
        message,
        recipientFilter: selectedRecipients,
      });
      return result.data;
    },
    onSuccess: () => {
      setMessage('');
      setSubject('');
    },
  });

  return (
    <div className="space-y-6">
      {/* Mass Messaging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Mass Message
          </CardTitle>
          <CardDescription>Send announcements to platform users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Subject</label>
            <Input
              placeholder="Announcement subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Message</label>
            <Textarea
              placeholder="Your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 min-h-[120px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Recipients</label>
            <select
              value={selectedRecipients}
              onChange={(e) => setSelectedRecipients(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="all">All Users</option>
              <option value="artists">Artists</option>
              <option value="community_leaders">Community Leaders</option>
              <option value="recent">Recent Users (Last 30 days)</option>
            </select>
          </div>
          <Button
            onClick={() => sendMassMessageMutation.mutate()}
            disabled={!subject || !message || sendMassMessageMutation.isPending}
            className="w-full"
          >
            {sendMassMessageMutation.isPending ? 'Sending...' : 'Send Message'}
          </Button>
          {sendMassMessageMutation.isSuccess && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <AlertDescription className="text-green-700">Message sent successfully!</AlertDescription>
            </Alert>
          )}
          {sendMassMessageMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>{sendMassMessageMutation.error?.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Platform Settings Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Platform Settings
          </CardTitle>
          <CardDescription>Configure platform behavior and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Additional settings coming soon:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Featured content management</li>
            <li>Announcement banners</li>
            <li>Feature flags &amp; experiments</li>
            <li>Email settings</li>
            <li>API rate limits</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}