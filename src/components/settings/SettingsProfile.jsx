import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsProfile({ user, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ display_name: '', bio: '', website: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        display_name: user.display_name || user.full_name || '',
        bio: user.bio || '',
        website: user.website || '',
      });
    }
  }, [user?.id]);

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      display_name: form.display_name.trim(),
      bio: form.bio.trim(),
      website: form.website.trim(),
    });
    setSaving(false);
    onSaved?.();
    toast({ title: 'Profile updated' });
  };

  const changed =
    form.display_name !== (user?.display_name || user?.full_name || '') ||
    form.bio !== (user?.bio || '') ||
    form.website !== (user?.website || '');

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div>
        <h2 className="font-semibold text-foreground">Public Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">This information is visible to other members.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Display Name</Label>
          <Input
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            placeholder="How should we call you?"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Bio</Label>
          <Textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell the community about yourself…"
            className="mt-1.5 resize-none"
            rows={3}
          />
        </div>

        <div>
          <Label>Website</Label>
          <Input
            value={form.website}
            onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            placeholder="https://yoursite.com"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input value={user?.email || ''} disabled className="mt-1.5 opacity-60" />
          <p className="text-xs text-muted-foreground mt-1">Email is managed by your account provider.</p>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={!changed || saving || !form.display_name.trim()}
        className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1.5" /> Save Changes</>}
      </Button>
    </div>
  );
}