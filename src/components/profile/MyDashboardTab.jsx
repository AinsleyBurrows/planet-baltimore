import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  FileText, Calendar, Heart, MessageCircle, Bookmark,
  Users, TrendingUp, BarChart3, ExternalLink
} from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color = 'text-accent' }) => (
  <Card className="bg-card border-border">
    <CardContent className="flex items-center gap-3 p-4">
      <div className="p-2 bg-secondary rounded-lg">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value ?? 0}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default function MyDashboardTab({ userId, isAdmin }) {
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['dashboard-posts', userId],
    queryFn: () => base44.entities.Post.filter({ author_id: userId, page_type: 'personal' }, '-created_date', 100),
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['dashboard-events', userId],
    queryFn: () => base44.entities.Event.filter({ organizer_id: userId }, '-date', 50),
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: rsvps = [] } = useQuery({
    queryKey: ['dashboard-rsvps', userId],
    queryFn: () => base44.entities.RSVP.filter({ user_id: userId }),
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: savedPosts = [] } = useQuery({
    queryKey: ['dashboard-saved', userId],
    queryFn: () => base44.entities.SavedPost.filter({ user_id: userId }),
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['dashboard-followers', userId],
    queryFn: () => base44.entities.Follow.filter({ target_type: 'user', target_id: userId }),
    enabled: !!userId,
    staleTime: 30000,
  });

  const { data: adminAnalytics, isLoading: loadingAdmin } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const result = await base44.functions.invoke('getAdminAnalytics', {});
      return result.data;
    },
    enabled: !!isAdmin,
    staleTime: 60000,
  });

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const isLoading = loadingPosts || loadingEvents;

  return (
    <div className="space-y-6 pb-6">
      {/* Personal Stats */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Activity</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={FileText} label="Posts" value={posts.length} />
            <StatCard icon={Heart} label="Total Likes" value={totalLikes} color="text-red-500" />
            <StatCard icon={MessageCircle} label="Comments Received" value={totalComments} color="text-blue-500" />
            <StatCard icon={Users} label="Followers" value={followers.length} color="text-green-500" />
            <StatCard icon={Calendar} label="Events Organized" value={events.length} color="text-purple-500" />
            <StatCard icon={Bookmark} label="Saved Posts" value={savedPosts.length} color="text-yellow-500" />
          </div>
        )}
      </div>

      {/* Recent Events */}
      {events.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Events</h2>
            <Link to="/organizer-studio" className="text-xs text-accent hover:underline flex items-center gap-1">
              Organizer Studio <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {events.slice(0, 3).map(event => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.rsvp_count || 0} RSVPs · {event.status}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    event.status === 'upcoming' ? 'bg-green-100 text-green-700' :
                    event.status === 'completed' ? 'bg-secondary text-muted-foreground' :
                    'bg-destructive/10 text-destructive'
                  }`}>{event.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/organizer-studio">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
              <Calendar className="w-4 h-4" /> Organizer Studio
            </Button>
          </Link>
          <Link to="/ticket-sales-dashboard">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
              <TrendingUp className="w-4 h-4" /> Ticket Sales
            </Button>
          </Link>
          <Link to="/create-post">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
              <FileText className="w-4 h-4" /> New Post
            </Button>
          </Link>
          <Link to="/create-event">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
              <Calendar className="w-4 h-4" /> New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Admin Section */}
      {isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Platform Overview</h2>
            <Link to="/admin" className="text-xs text-accent hover:underline flex items-center gap-1">
              Full Dashboard <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {loadingAdmin ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : adminAnalytics?.metrics ? (
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} label="Total Users" value={adminAnalytics.metrics.totalUsers} color="text-accent" />
              <StatCard icon={FileText} label="Total Posts" value={adminAnalytics.metrics.totalPosts} color="text-blue-500" />
              <StatCard icon={Calendar} label="Total Events" value={adminAnalytics.metrics.totalEvents} color="text-purple-500" />
              <StatCard icon={BarChart3} label="Open Reports" value={adminAnalytics.metrics.openReports} color="text-destructive" />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}