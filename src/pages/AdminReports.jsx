import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Flag, CheckCircle2, XCircle, AlertTriangle, Clock, ExternalLink, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  dismissed: 'bg-secondary text-muted-foreground border-border',
  action_taken: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_ICONS = {
  pending: Clock,
  reviewed: AlertTriangle,
  dismissed: XCircle,
  action_taken: CheckCircle2,
};

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  hate_speech: 'Hate Speech',
  misinformation: 'Misinformation',
  impersonation: 'Impersonation',
  inappropriate_content: 'Inappropriate Content',
  other: 'Other',
};

const TARGET_LINKS = {
  post: null, // no dedicated page
  event: (id) => `/events/${id}`,
  comment: null,
  user: (id) => `/profile/${id}`,
  artist: (id) => `/artists/${id}`,
  business: (id) => `/businesses/${id}`,
  community: (id) => `/communities/${id}`,
  association: (id) => `/community-associations/${id}`,
  story: (id) => `/stories/${id}`,
};

function ReportCard({ report, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(report.admin_notes || '');
  const Icon = STATUS_ICONS[report.status] || Clock;
  const targetLink = TARGET_LINKS[report.target_type]?.(report.target_id);

  const handleStatus = async (newStatus) => {
    setUpdating(true);
    await base44.entities.Report.update(report.id, { status: newStatus, admin_notes: notes });
    onUpdateStatus();
    setUpdating(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
          <Flag className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground capitalize">{report.target_type}</span>
            {report.target_name && <span className="text-sm text-muted-foreground truncate">— {report.target_name}</span>}
            <Badge className={`text-xs border ${STATUS_COLORS[report.status]}`}>
              <Icon className="w-3 h-3 mr-1" />
              {report.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs font-medium text-destructive">{REASON_LABELS[report.reason] || report.reason}</span>
            <span className="text-xs text-muted-foreground">
              {report.created_date ? format(new Date(report.created_date), 'MMM d, yyyy · h:mm a') : ''}
            </span>
            {report.reporter_email && (
              <span className="text-xs text-muted-foreground">by {report.reporter_email}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {targetLink && (
            <Link to={targetLink} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="View reported content">
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 space-y-3 pt-3">
          {report.details && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reporter's notes</p>
              <p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3">{report.details}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Admin notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add internal notes…"
              className="w-full px-3 py-2 rounded-lg border border-input bg-transparent text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring min-h-[70px]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatus('reviewed')}
              className="text-blue-700 border-blue-300 hover:bg-blue-50">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Mark Reviewed
            </Button>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatus('action_taken')}
              className="text-green-700 border-green-300 hover:bg-green-50">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Action Taken
            </Button>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatus('dismissed')}
              className="text-muted-foreground">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Dismiss
            </Button>
            {report.status !== 'pending' && (
              <Button size="sm" variant="ghost" disabled={updating} onClick={() => handleStatus('pending')}
                className="text-yellow-700">
                <Clock className="w-3.5 h-3.5 mr-1" /> Reset to Pending
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const FILTER_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'action_taken', label: 'Action Taken' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'all', label: 'All' },
];

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState('pending');
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () =>
      statusFilter === 'all'
        ? base44.entities.Report.list('-created_date', 200)
        : base44.entities.Report.filter({ status: statusFilter }, '-created_date', 200),
    staleTime: 30000,
  });

  const pendingCount = useQuery({
    queryKey: ['admin-reports-pending-count'],
    queryFn: () => base44.entities.Report.filter({ status: 'pending' }, '-created_date', 200),
    staleTime: 30000,
  }).data?.length || 0;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    queryClient.invalidateQueries({ queryKey: ['admin-reports-pending-count'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-8 bg-transparent border-2 border-destructive/40">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Flag className="w-5 h-5 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Content Reports</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-destructive text-white text-sm font-bold">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Review and act on content flagged by the community.</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              statusFilter === tab.key
                ? 'border-[#d4580a] text-[#d4580a]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && reports.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle2 className="w-12 h-12 text-green-500/40 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No {statusFilter === 'all' ? '' : statusFilter} reports</p>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter === 'pending' ? 'All clear — nothing needs your attention.' : 'Nothing here yet.'}
          </p>
        </div>
      )}

      {/* Report cards */}
      {!isLoading && reports.length > 0 && (
        <div className="space-y-3">
          {reports.map(report => (
            <ReportCard key={report.id} report={report} onUpdateStatus={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}