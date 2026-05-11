import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Heart, MessageCircle, Users, Calendar, Check, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const iconMap = {
  follow: Users,
  like: Heart,
  comment: MessageCircle,
  event_reminder: Calendar,
  community_update: Users,
  mention: MessageCircle,
  message: MessageCircle,
  announcement: Bell,
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-12" style={{ backgroundColor: '#d4580a' }}>
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">Notifications</h1>
            <p className="text-white/80 text-sm sm:text-base">Stay up to date with activity across your community.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="text-sm gap-1 bg-white/20 border-white/30 hover:bg-white/30" onClick={() => notifications.filter(n => !n.is_read).forEach(n => markReadMutation.mutate(n.id))}>
                <Check className="w-4 h-4" /> Mark all read
              </Button>
            )}
            <Link to="/notification-settings">
              <Button variant="outline" size="icon" className="rounded-full bg-white/20 border-white/30 hover:bg-white/30"><Settings className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">When people interact with you, you'll see it here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            return (
              <div key={notif.id} onClick={() => { if (!notif.is_read) markReadMutation.mutate(notif.id); if (notif.link) navigate(notif.link); }} className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${notif.is_read ? 'hover:bg-secondary/50' : 'bg-accent/5 hover:bg-accent/10'}`}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={notif.actor_avatar} />
                  <AvatarFallback className="bg-accent/10 text-accent text-xs">{notif.actor_name?.charAt(0) || <Icon className="w-4 h-4" />}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground"><Link to={`/profile/${notif.actor_id}`} onClick={e => e.stopPropagation()} className="font-semibold hover:text-accent transition-colors">{notif.actor_name}</Link> {notif.body || notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notif.created_date ? format(new Date(notif.created_date), 'MMM d, h:mm a') : ''}</p>
                </div>
                {!notif.is_read && <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}