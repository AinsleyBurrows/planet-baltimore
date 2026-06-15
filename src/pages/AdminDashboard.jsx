import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BarChart3, Shield, Settings, Inbox, Award } from 'lucide-react';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminModeration from '@/components/admin/AdminModeration';
import AdminFlaggedQueue from '@/components/admin/AdminFlaggedQueue';
import AdminVerification from '@/components/admin/AdminVerification';
import AdminSettings from '@/components/admin/AdminSettings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const result = await base44.functions.invoke('getAdminAnalytics', {});
      return result.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'You do not have admin access.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview, moderation, and settings</p>
        </div>

        {/* Tabs */}
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              <span className="hidden sm:inline">Queue</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Verify</span>
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Moderation</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-8">
            <AdminAnalytics data={analyticsData} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="queue" className="mt-8">
            <AdminFlaggedQueue />
          </TabsContent>

          <TabsContent value="verification" className="mt-8">
            <AdminVerification />
          </TabsContent>

          <TabsContent value="moderation" className="mt-8">
            <AdminModeration />
          </TabsContent>

          <TabsContent value="settings" className="mt-8">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}