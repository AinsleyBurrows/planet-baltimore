import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Heart, MessageCircle, TrendingUp, Plus, Pencil, Trash2, Calendar, CheckCircle, Save, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function WritingDashboardV2() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['my-stories', user?.id],
    queryFn: () => base44.entities.Story.filter({ author_id: user.id }, '-created_date', 100),
    enabled: !!user?.id,
  });

  const { data: reactions = [] } = useQuery({
    queryKey: ['my-reactions', user?.id],
    queryFn: async () => {
      const allReactions = await base44.entities.StoryReaction.list('', 1000);
      const myStoryIds = stories.map(s => s.id);
      return allReactions.filter(r => myStoryIds.includes(r.story_id));
    },
    enabled: !!user?.id && stories.length > 0,
  });

  const deleteMutation = useMutation({
    mutationFn: (storyId) => base44.entities.Story.delete(storyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-stories', user?.id] }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ storyId, scheduledDate = null }) =>
      base44.entities.Story.update(storyId, {
        status: 'published',
        published_at: scheduledDate ? scheduledDate.toISOString() : new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-stories', user?.id] }),
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-20 rounded-xl" />
      {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  );

  const published = stories.filter(s => s.status === 'published');
  const drafts = stories.filter(s => s.status === 'draft');
  const totalViews = published.reduce((sum, s) => sum + (s.views_count || 0), 0);
  const totalLikes = reactions.length;

  const categoryData = published.reduce((acc, story) => {
    const cat = story.category || 'uncategorized';
    const existing = acc.find(c => c.name === cat);
    if (existing) {
      existing.views += story.views_count || 0;
      existing.count += 1;
    } else {
      acc.push({
        name: cat.replace('_', ' '),
        views: story.views_count || 0,
        count: 1,
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Your Writing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and grow your writing</p>
        </div>
        <Link to="/create-story">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 rounded-lg">
            <Plus className="w-4 h-4" />
            New Story
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Total Views</p>
          <p className="text-3xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            {published.length} published
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Total Reactions</p>
          <p className="text-3xl font-bold text-foreground">{totalLikes.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="w-3.5 h-3.5" />
            From readers
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Stories</p>
          <p className="text-3xl font-bold text-foreground">{published.length}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle className="w-3.5 h-3.5" />
            {drafts.length} drafts
          </div>
        </Card>

        <Card className="p-5 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Avg. Performance</p>
          <p className="text-3xl font-bold text-foreground">
            {published.length > 0 ? Math.round(totalViews / published.length) : 0}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            Views per story
          </div>
        </Card>
      </div>

      {/* Charts */}
      {published.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Views by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="views" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Story Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Stories List */}
      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="space-y-3 mt-4">
          {published.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No published stories yet</p>
            </div>
          ) : (
            published.map(story => (
              <Card key={story.id} className="p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{story.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{(story.views_count || 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{reactions.filter(r => r.story_id === story.id).length}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{story.comments_count || 0}</span>
                      <span>{format(new Date(story.published_at), 'MMM d')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/create-story?id=${story.id}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm('Delete this story?')) {
                          deleteMutation.mutate(story.id);
                        }
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="drafts" className="space-y-3 mt-4">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No drafts yet</p>
            </div>
          ) : (
            drafts.map(story => (
              <Card key={story.id} className="p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{story.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Saved {format(new Date(story.updated_date), 'MMM d, yyyy')}</p>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Schedule
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72" align="end">
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Select publication date</p>
                          <CalendarComponent
                            mode="single"
                            disabled={(date) => date < new Date()}
                            onSelect={(date) => {
                              publishMutation.mutate({ storyId: story.id, scheduledDate: date });
                            }}
                            className="rounded-md border border-border"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button
                      size="sm"
                      onClick={() => publishMutation.mutate({ storyId: story.id })}
                      disabled={publishMutation.isPending}
                      className="h-8 px-2 text-xs bg-accent/10 text-accent hover:bg-accent/20"
                    >
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/create-story?id=${story.id}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm('Delete this story?')) {
                          deleteMutation.mutate(story.id);
                        }
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Link } from 'react-router-dom';