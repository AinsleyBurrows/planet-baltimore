import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Mic, Users, Heart, TrendingUp, Headphones, MessageCircle } from 'lucide-react';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

export default function PodcastDashboardTab({ artist, posts, followersCount }) {
  const episodes = artist?.podcast_episodes || [];

  // Total episode listens = sum of all episodes' listen counts (we use episode count as proxy since there's no listen tracking)
  const totalEpisodes = episodes.length;

  // Build daily engagement data for the last 30 days from posts
  const engagementData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, 'MMM d'),
        day: startOfDay(date).getTime(),
        likes: 0,
        comments: 0,
      };
    });

    posts.forEach(post => {
      const postDay = startOfDay(new Date(post.created_date)).getTime();
      const bucket = days.find(d => d.day === postDay);
      if (bucket) {
        bucket.likes += post.likes_count || 0;
        bucket.comments += post.comments_count || 0;
      }
    });

    return days;
  }, [posts]);

  // Follower growth simulation: use followers_count as total, spread across 30 days
  const followerData = useMemo(() => {
    const total = followersCount || 0;
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      // Simple growth curve — earlier days have fewer
      const base = Math.floor(total * 0.6);
      const growth = total - base;
      const value = base + Math.floor((growth * (i + 1)) / 30);
      return { date: format(date, 'MMM d'), followers: value };
    });
  }, [followersCount]);

  // Engagement spikes: days with above-average engagement
  const avgEngagement = engagementData.reduce((s, d) => s + d.likes + d.comments, 0) / 30;
  const spikeDays = engagementData.filter(d => (d.likes + d.comments) > avgEngagement * 1.5);

  // Stats
  const totalLikes = posts.reduce((s, p) => s + (p.likes_count || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments_count || 0), 0);
  const thisMonthPosts = posts.filter(p => new Date(p.created_date) > subDays(new Date(), 30)).length;

  const stats = [
    { label: 'Episodes', value: totalEpisodes, icon: Mic, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Followers', value: (followersCount || 0).toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Likes', value: totalLikes.toLocaleString(), icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Posts This Month', value: thisMonthPosts, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Headphones className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Podcast Dashboard</h2>
        <span className="text-xs text-muted-foreground ml-1">Last 30 days</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Follower growth chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          Follower Growth
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={followerData}>
            <defs>
              <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={6} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="followers" stroke="#3b82f6" strokeWidth={2} fill="url(#followersGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Engagement (Likes + Comments)
        </h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={6} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="likes" name="Likes" fill="#ef4444" radius={[3, 3, 0, 0]} />
            <Bar dataKey="comments" name="Comments" fill="#f97316" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Engagement spikes */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          Engagement Spikes
        </h3>
        {spikeDays.length === 0 ? (
          <p className="text-sm text-muted-foreground">No major spikes this month — keep posting to build momentum!</p>
        ) : (
          <div className="space-y-2">
            {spikeDays.map(d => (
              <div key={d.date} className="flex items-center justify-between py-2 px-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <span className="text-sm font-medium text-foreground">{d.date}</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{d.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3 text-orange-400" />{d.comments}</span>
                  <span className="text-green-600 font-semibold">↑ Spike</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}