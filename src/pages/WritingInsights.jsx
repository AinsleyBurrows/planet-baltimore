import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Clock, TrendingUp, BookOpen, Share2, UserPlus, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';
import ShareModal from '@/components/shared/ShareModal';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function WritingInsights() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['my-stories', user?.id],
    queryFn: () => base44.entities.Story.filter({ author_id: user.id }, '-created_date', 100),
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (storyId) => base44.entities.Story.delete(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-stories', user?.id] });
    },
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );

  // Calculate metrics
  const totalViews = stories.reduce((sum, s) => sum + (s.views_count || 0), 0);
  const avgReadingTime = stories.length > 0 ? Math.round(stories.reduce((sum, s) => sum + (s.reading_time || 0), 0) / stories.length) : 0;
  const publishedCount = stories.filter(s => s.status === 'published').length;

  // Category breakdown
  const categoryData = stories.reduce((acc, story) => {
    const cat = story.category || 'uncategorized';
    const existing = acc.find(c => c.name === cat);
    if (existing) {
      existing.views += story.views_count || 0;
      existing.count += 1;
      existing.avgReadTime += story.reading_time || 0;
    } else {
      acc.push({
        name: cat.replace('_', ' '),
        views: story.views_count || 0,
        count: 1,
        avgReadTime: story.reading_time || 0,
      });
    }
    return acc;
  }, []).map(c => ({ ...c, avgReadTime: Math.round(c.avgReadTime / c.count) }));

  // Top performing stories
  const topStories = [...stories].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Writing Insights</h1>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/create-story')}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Writing</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInvite(true)}
            className="gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowShare(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Views</p>
              <p className="text-3xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-2">{publishedCount} published stories</p>
            </div>
            <Eye className="w-8 h-8 text-accent/60 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-5 border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Reading Time</p>
              <p className="text-3xl font-bold text-foreground">{avgReadingTime} <span className="text-lg font-normal text-muted-foreground">min</span></p>
              <p className="text-xs text-muted-foreground mt-2">Per story</p>
            </div>
            <Clock className="w-8 h-8 text-accent/60 flex-shrink-0" />
          </div>
        </Card>

        <Card className="p-5 border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Stories</p>
              <p className="text-3xl font-bold text-foreground">{stories.length}</p>
              <p className="text-xs text-muted-foreground mt-2">{stories.filter(s => s.status === 'draft').length} drafts</p>
            </div>
            <BookOpen className="w-8 h-8 text-accent/60 flex-shrink-0" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views by Category */}
        <Card className="p-5 border-border">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" />Views by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="views" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
          )}
        </Card>

        {/* Category Distribution */}
        <Card className="p-5 border-border">
          <h2 className="font-semibold text-foreground mb-4">Stories by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
          )}
        </Card>
      </div>

      {/* Category Details Table */}
      {categoryData.length > 0 && (
        <Card className="p-5 border-border overflow-x-auto">
          <h2 className="font-semibold text-foreground mb-4">Category Performance</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Category</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Stories</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Total Views</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Avg Time (min)</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.map(cat => (
                <tr key={cat.name} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                  <td className="py-3 px-2 text-foreground capitalize">{cat.name}</td>
                  <td className="text-right py-3 px-2 text-foreground font-medium">{cat.count}</td>
                  <td className="text-right py-3 px-2 text-accent font-medium">{cat.views.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 text-foreground">{cat.avgReadTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Top Performing Stories */}
      {topStories.length > 0 && (
        <Card className="p-5 border-border">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" />Top Performing Stories</h2>
          <div className="space-y-3">
            {topStories.map((story, idx) => (
              <div key={story.id} className="flex items-center gap-4 p-3 bg-secondary/40 rounded-lg group hover:bg-secondary/60 transition-colors">
                <div className="text-lg font-bold text-accent/60 w-6">#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{story.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{story.category?.replace('_', ' ')}</p>
                </div>
                <div className="text-right flex-shrink-0 mr-3">
                  <p className="text-sm font-medium text-accent">{(story.views_count || 0).toLocaleString()} views</p>
                  <p className="text-xs text-muted-foreground">{story.reading_time || 0} min read</p>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/create-story?id=${story.id}`)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm('Delete this story? This action cannot be undone.')) {
                        deleteMutation.mutate(story.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {stories.length === 0 && (
        <Card className="p-12 border-border text-center">
          <p className="text-muted-foreground">Start publishing stories to see your insights here.</p>
          <Button className="mt-4 bg-accent hover:bg-accent/90" onClick={() => navigate('/create-story')}>Write Your First Story</Button>
        </Card>
      )}

      {showInvite && <InviteFriendsModal onClose={() => setShowInvite(false)} />}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/profile/${user?.id}`}
        title={`Check out my writing insights on Planet Baltimore`}
        description={`I've published ${publishedCount} stories with ${totalViews.toLocaleString()} total views.`}
      />
    </div>
  );
}