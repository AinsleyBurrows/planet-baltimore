import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, Ban, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminModeration() {
  const [selectedReport, setSelectedReport] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => base44.asServiceRole.entities.Report.filter({ status: 'open' }, '-created_date', 50),
  });

  const dismissMutation = useMutation({
    mutationFn: async (reportId) => {
      await base44.asServiceRole.entities.Report.update(reportId, { status: 'dismissed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (report) => {
      // Delete the reported content
      const entityMap = {
        post: 'Post',
        story: 'Story',
        comment: 'Comment',
        user: 'User',
      };
      const entityName = entityMap[report.target_type];
      if (entityName) {
        await base44.asServiceRole.entities[entityName].delete(report.target_id);
      }
      // Mark report as resolved
      await base44.asServiceRole.entities.Report.update(report.id, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
    },
  });

  const muteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.asServiceRole.entities.User.update(userId, { is_muted: true });
      // Find and resolve all reports from this user
      const userReports = reports.filter(r => r.reporter_id === userId);
      for (const report of userReports) {
        await base44.asServiceRole.entities.Report.update(report.id, { status: 'resolved' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setSelectedReport(null);
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {reports.length === 0 ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>No open reports. Platform is clean!</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Reports List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Open Reports ({reports.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reports.map(report => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? 'bg-accent/10 border-accent'
                          : 'border-border hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{report.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {report.target_type} • Reported by {report.reporter_name || 'Unknown'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">{report.target_type}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Report Detail & Actions */}
            {selectedReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Report Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Reason</p>
                    <p className="text-sm text-foreground mt-1">{selectedReport.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Content Type</p>
                    <p className="text-sm text-foreground mt-1 capitalize">{selectedReport.target_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Reported By</p>
                    <p className="text-sm text-foreground mt-1">{selectedReport.reporter_name || 'Unknown'}</p>
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => dismissMutation.mutate(selectedReport.id)}
                      disabled={dismissMutation.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Dismiss Report
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => deleteContentMutation.mutate(selectedReport)}
                      disabled={deleteContentMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Content
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={() => muteUserMutation.mutate(selectedReport.reporter_id)}
                      disabled={muteUserMutation.isPending}
                    >
                      <Ban className="w-4 h-4" />
                      Mute User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}