import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Trash2, Ban, CheckCircle2, Flag, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminFlaggedQueue() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [banDialog, setBanDialog] = useState(null);
  const [filter, setFilter] = useState('all'); // all, posts, comments, stories
  const queryClient = useQueryClient();

  // Fetch flagged reports
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-queue-reports'],
    queryFn: () => base44.asServiceRole.entities.Report.filter({ status: 'open' }, '-created_date', 100),
    refetchInterval: 10000,
  });

  // Fetch content details for preview
  const { data: contentMap = {} } = useQuery({
    queryKey: ['flagged-content', reports.map(r => `${r.target_type}-${r.target_id}`).join(',')],
    queryFn: async () => {
      const map = {};
      for (const report of reports) {
        try {
          const entityMap = { post: 'Post', comment: 'Comment', story: 'Story' };
          const entity = await base44.asServiceRole.entities[entityMap[report.target_type]].get(report.target_id);
          map[`${report.target_type}-${report.target_id}`] = entity;
        } catch (e) {
          // Content may have been deleted
        }
      }
      return map;
    },
    enabled: reports.length > 0,
  });

  const dismissMutation = useMutation({
    mutationFn: async (reportId) => {
      await base44.asServiceRole.entities.Report.update(reportId, { status: 'dismissed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue-reports'] });
      setSelectedItem(null);
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: async (report) => {
      const entityMap = { post: 'Post', story: 'Story', comment: 'Comment' };
      const entityName = entityMap[report.target_type];
      if (entityName) {
        await base44.asServiceRole.entities[entityName].delete(report.target_id);
      }
      await base44.asServiceRole.entities.Report.update(report.id, { status: 'resolved' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue-reports'] });
      setSelectedItem(null);
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId) => {
      const userPosts = await base44.asServiceRole.entities.Post.filter({ created_by_id: userId }, '-created_date', 1000);
      for (const post of userPosts) {
        await base44.asServiceRole.entities.Post.update(post.id, { is_deleted: true });
      }
      
      const userStories = await base44.asServiceRole.entities.Story.filter({ created_by_id: userId }, '-created_date', 1000);
      for (const story of userStories) {
        await base44.asServiceRole.entities.Story.delete(story.id);
      }

      await base44.asServiceRole.entities.User.update(userId, { is_muted: true, role: 'banned' });

      const userTargetReports = reports.filter(r => r.target_id === userId);
      for (const report of userTargetReports) {
        await base44.asServiceRole.entities.Report.update(report.id, { status: 'resolved' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue-reports'] });
      setBanDialog(null);
      setSelectedItem(null);
    },
  });

  // Filter reports by type
  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.target_type === filter);

  const getContentPreview = (report) => {
    const content = contentMap[`${report.target_type}-${report.target_id}`];
    if (!content) return 'Content deleted or unavailable';
    
    if (report.target_type === 'post') {
      return content.content || content.title || 'Image post';
    }
    if (report.target_type === 'comment') {
      return content.content;
    }
    if (report.target_type === 'story') {
      return `Story by ${content.author_name}`;
    }
    return 'Unknown content';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading queue...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'posts', 'comments', 'stories'].map(type => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
        <Badge variant="secondary" className="ml-auto">
          {filteredReports.length} pending
        </Badge>
      </div>

      {filteredReports.length === 0 ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>No flagged content to review.</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Queue List */}
          <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto">
            {filteredReports.map(report => (
              <div
                key={report.id}
                onClick={() => setSelectedItem(report)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedItem?.id === report.id
                    ? 'bg-accent/10 border-accent'
                    : 'border-border hover:bg-secondary/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-4 h-4 text-destructive flex-shrink-0" />
                      <Badge variant="outline" className="text-xs">
                        {report.target_type}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">
                      {getContentPreview(report)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Reason:</strong> {report.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Reported by:</strong> {report.reporter_name || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Panel */}
          {selectedItem && (
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-secondary/50 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">{getContentPreview(selectedItem)}</p>
                  <p className="text-xs text-muted-foreground">
                    Type: <span className="capitalize font-medium">{selectedItem.target_type}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    By: {selectedItem.creator_name || selectedItem.author_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    "{selectedItem.reason}"
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => dismissMutation.mutate(selectedItem.id)}
                    disabled={dismissMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Dismiss
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full justify-start gap-2 text-xs"
                    onClick={() => deleteContentMutation.mutate(selectedItem)}
                    disabled={deleteContentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Content
                  </Button>
                  <Button
                    size="sm"
                    className="w-full justify-start gap-2 text-xs bg-red-600 hover:bg-red-700"
                    onClick={() => setBanDialog(selectedItem)}
                    disabled={banUserMutation.isPending}
                  >
                    <Ban className="w-4 h-4" />
                    Ban User
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Ban Confirmation */}
      <AlertDialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently ban the account and hide all their content. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              const targetId = banDialog.target_type === 'post' || banDialog.target_type === 'comment' || banDialog.target_type === 'story'
                ? contentMap[`${banDialog.target_type}-${banDialog.target_id}`]?.created_by_id
                : banDialog.target_id;
              if (targetId) banUserMutation.mutate(targetId);
            }}
          >
            Confirm Ban
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}