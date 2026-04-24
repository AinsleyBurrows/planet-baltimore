import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bell, Mail, Heart, MessageCircle, Users, Calendar, BookOpen, Megaphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const IN_APP_PREFS = [
  { key: 'new_follower', label: 'New Followers', icon: Users, description: 'When someone follows you' },
  { key: 'new_comment', label: 'Comments', icon: MessageCircle, description: 'When someone comments on your content' },
  { key: 'new_like', label: 'Likes', icon: Heart, description: 'When someone likes your post' },
  { key: 'new_mention', label: 'Mentions', icon: MessageCircle, description: 'When someone mentions you' },
  { key: 'event_from_followed', label: 'New Events', icon: Calendar, description: 'From organizers you follow' },
  { key: 'zine_from_followed', label: 'New Stories', icon: BookOpen, description: 'From artists you follow' },
  { key: 'community_updates', label: 'Community Updates', icon: Users, description: 'From communities you\'re in' },
  { key: 'mass_messages', label: 'Association Announcements', icon: Megaphone, description: 'Official messages from neighborhood associations' },
];

const EMAIL_PREFS = [
  { key: 'email_new_follower', label: 'New Followers', icon: Users },
  { key: 'email_new_comment', label: 'Comments', icon: MessageCircle },
  { key: 'email_event_from_followed', label: 'New Events from Followed Organizers', icon: Calendar },
  { key: 'email_zine_from_followed', label: 'New Stories from Followed Artists', icon: BookOpen },
  { key: 'email_community_updates', label: 'Community Updates', icon: Users },
  { key: 'email_mass_messages', label: 'Association Announcements', icon: Megaphone },
];

const defaultPrefs = {
  new_follower: true, new_comment: true, new_like: true, new_mention: true,
  event_from_followed: true, zine_from_followed: true, community_updates: true, mass_messages: true,
  email_new_follower: false, email_new_comment: false, email_event_from_followed: true,
  email_zine_from_followed: true, email_community_updates: true, email_mass_messages: true,
};

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [prefs, setPrefs] = useState(defaultPrefs);

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: existing, isLoading } = useQuery({
    queryKey: ['notif-prefs', user?.id],
    queryFn: async () => {
      const r = await base44.entities.NotificationPreference.filter({ user_id: user.id });
      return r[0] || null;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (existing) setPrefs({ ...defaultPrefs, ...existing });
  }, [existing]);

  const mutation = useMutation({
    mutationFn: async (newPrefs) => {
      if (existing?.id) return base44.entities.NotificationPreference.update(existing.id, newPrefs);
      return base44.entities.NotificationPreference.create({ ...newPrefs, user_id: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-prefs', user?.id] });
      toast({ title: 'Preferences saved' });
    },
  });

  const toggle = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    mutation.mutate(updated);
  };

  if (isLoading) return <div className="space-y-3">{Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Notification Settings</h1>
          <p className="text-sm text-muted-foreground">Control what you're notified about</p>
        </div>
      </div>

      {/* In-app */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-foreground text-sm">In-App Notifications</h2>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {IN_APP_PREFS.map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex items-center justify-between p-4">
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
      </section>

      {/* Email */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-foreground text-sm">Email Notifications</h2>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {EMAIL_PREFS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm font-medium text-foreground">{label}</p>
              </div>
              <Switch checked={!!prefs[key]} onCheckedChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}