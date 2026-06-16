import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Mail, Users, MessageCircle, Heart, Calendar, BookOpen, Megaphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

const IN_APP_PREFS = [
  { key: 'new_follower', label: 'New Followers', icon: Users, description: 'When someone follows you' },
  { key: 'new_comment', label: 'Comments', icon: MessageCircle, description: 'When someone comments on your content' },
  { key: 'new_like', label: 'Likes', icon: Heart, description: 'When someone likes your post' },
  { key: 'new_mention', label: 'Mentions', icon: MessageCircle, description: 'When someone mentions you' },
  { key: 'event_from_followed', label: 'New Events', icon: Calendar, description: 'From organizers you follow' },
  { key: 'zine_from_followed', label: 'New Stories', icon: BookOpen, description: 'From artists you follow' },
  { key: 'community_updates', label: 'Community Updates', icon: Users, description: 'From communities you\'re in' },
  { key: 'mass_messages', label: 'Announcements', icon: Megaphone, description: 'Official neighborhood messages' },
];

const EMAIL_PREFS = [
  { key: 'email_new_follower', label: 'New Followers', icon: Users },
  { key: 'email_new_comment', label: 'Comments', icon: MessageCircle },
  { key: 'email_event_from_followed', label: 'New Events', icon: Calendar },
  { key: 'email_zine_from_followed', label: 'New Stories', icon: BookOpen },
  { key: 'email_community_updates', label: 'Community Updates', icon: Users },
  { key: 'email_mass_messages', label: 'Announcements', icon: Megaphone },
];

const defaultPrefs = {
  new_follower: true, new_comment: true, new_like: true, new_mention: true,
  event_from_followed: true, zine_from_followed: true, community_updates: true, mass_messages: true,
  email_new_follower: true, email_new_comment: true, email_event_from_followed: true,
  email_zine_from_followed: true, email_community_updates: true, email_mass_messages: true,
};

export default function SettingsNotifications({ userId }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prefs, setPrefs] = useState(defaultPrefs);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['notif-prefs', userId],
    queryFn: async () => {
      const r = await base44.entities.NotificationPreference.filter({ user_id: userId });
      return r[0] || null;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (existing) setPrefs({ ...defaultPrefs, ...existing });
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async (newPrefs) => {
      if (existing?.id) return base44.entities.NotificationPreference.update(existing.id, newPrefs);
      return base44.entities.NotificationPreference.create({ ...newPrefs, user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-prefs', userId] });
      toast({ title: 'Notification preferences saved' });
    },
  });

  const toggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    mutation.mutate(updated);
  };

  if (isLoading) return <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {/* In-app */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-foreground">In-App Notifications</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-accent hover:text-accent/80 h-7"
            onClick={() => {
              const allOn = Object.fromEntries(IN_APP_PREFS.map(p => [p.key, true]));
              const updated = { ...prefs, ...allOn };
              setPrefs(updated);
              mutation.mutate(updated);
            }}
          >
            All On
          </Button>
        </div>
        <div className="divide-y divide-border -mx-5">
          {IN_APP_PREFS.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-start gap-3">
                <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
              <Switch checked={!!prefs[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Email */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-foreground">Email Notifications</h2>
        </div>
        <div className="divide-y divide-border -mx-5">
          {EMAIL_PREFS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{label}</p>
              </div>
              <Switch checked={!!prefs[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}