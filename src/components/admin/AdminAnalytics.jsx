import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const StatCard = ({ icon: Icon, title, value, subtitle, trend }) => (
  <Card className="bg-card border-border hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-accent/10 rounded-lg">
          <Icon className="w-4 h-4 text-accent" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value?.toLocaleString?.() || value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {trend && <p className="text-xs text-accent mt-1">{trend}</p>}
    </CardContent>
  </Card>
);

export default function AdminAnalytics({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Key Metrics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Users}
            title="Total Users"
            value={metrics.totalUsers || 0}
            subtitle={`+${metrics.newUsersThisWeek || 0} this week`}
            trend="Active community members"
          />
          <StatCard
            icon={FileText}
            title="Posts"
            value={metrics.totalPosts || 0}
            subtitle={`+${metrics.activePostsThisWeek || 0} this week`}
            trend="Community engagement"
          />
          <StatCard
            icon={Calendar}
            title="Events"
            value={metrics.totalEvents || 0}
            subtitle={`${metrics.upcomingEvents || 0} upcoming`}
            trend="Active programming"
          />
          <StatCard
            icon={BookOpen}
            title="Stories"
            value={metrics.totalStories || 0}
            subtitle="Long-form content"
          />
          <StatCard
            icon={TrendingUp}
            title="Revenue"
            value={`$${(metrics.totalRevenue || 0).toFixed(2)}`}
            subtitle="Tickets + Marketplace"
            trend="Platform growth"
          />
          <StatCard
            icon={AlertCircle}
            title="Open Reports"
            value={metrics.openReports || 0}
            subtitle="Pending review"
            trend={metrics.openReports > 0 ? '⚠️ Action needed' : '✓ All clear'}
          />
        </div>
      </div>

      {/* Recent Reports */}
      {data?.recentReports?.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h2>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-2">
                {data.recentReports.map(report => (
                  <div key={report.id} className="px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{report.reason || 'Unreported'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Type: {report.target_type} • Status: {report.status}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.status === 'open' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}