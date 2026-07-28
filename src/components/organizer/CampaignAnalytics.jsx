import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Loader2, MailOpen, MousePointerClick, Send, BarChart3, Ticket } from 'lucide-react';

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

export default function CampaignAnalytics({ currentUser }) {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaign-analytics', currentUser?.id],
    queryFn: () => base44.entities.EmailCampaign.filter({ owner_id: currentUser.id }, '-sent_date', 100),
    enabled: !!currentUser?.id,
  });

  const stats = useMemo(() => {
    const sent = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0);
    const opens = campaigns.reduce((s, c) => s + (c.open_hashes?.length || 0), 0);
    const clicks = campaigns.reduce((s, c) => s + (c.click_hashes?.length || 0), 0);
    const totalOpens = campaigns.reduce((s, c) => s + (c.opens_count || 0), 0);
    const totalClicks = campaigns.reduce((s, c) => s + (c.clicks_count || 0), 0);
    return { sent, opens, clicks, totalOpens, totalClicks, openRate: pct(opens, sent), clickRate: pct(clicks, sent) };
  }, [campaigns]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-foreground/40" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-[#d4580a]" />
        <h2 className="text-xl font-bold text-foreground">Campaign Analytics</h2>
        <span className="text-xs text-muted-foreground">— email opens &amp; ticket-link clicks</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat label="Campaigns" value={campaigns.length} icon={BarChart3} />
        <Stat label="Emails Sent" value={stats.sent} icon={Send} />
        <Stat label="Unique Opens" value={stats.opens} sub={`${stats.totalOpens} total`} icon={MailOpen} />
        <Stat label="Open Rate" value={`${stats.openRate}%`} icon={MailOpen} />
        <Stat label="Unique Clicks" value={stats.clicks} sub={`${stats.totalClicks} total`} icon={MousePointerClick} />
        <Stat label="Click Rate" value={`${stats.clickRate}%`} icon={Ticket} />
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <MailOpen className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
          <p className="font-semibold text-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground">Send a campaign from Email Lists to see open and click analytics here.</p>
          <Link to="/email-lists" className="inline-block mt-3 text-sm font-medium text-[#d4580a] hover:underline">Go to Email Lists →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const sent = c.sent_count || 0;
            const opens = c.open_hashes?.length || 0;
            const clicks = c.click_hashes?.length || 0;
            const openRate = pct(opens, sent);
            const clickRate = pct(clicks, sent);
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{c.subject || '(no subject)'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.status === 'sent' && c.sent_date ? `Sent ${new Date(c.sent_date).toLocaleDateString()}` : c.status}
                      {c.event_id && <> · <Link to={`/events/${c.event_id}`} className="text-[#d4580a] hover:underline">View event</Link></>}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <Metric label="Sent" value={sent} />
                  <Metric label="Opens" value={opens} sub={`${openRate}%`} />
                  <Metric label="Clicks" value={clicks} sub={`${clickRate}%`} />
                  <Metric label="Failed" value={c.failed_count || 0} />
                </div>
                <div className="mt-3 space-y-2">
                  <Bar label="Open rate" value={openRate} color="#d4580a" />
                  <Bar label="Click rate" value={clickRate} color="#1a1f2e" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground -mt-0.5">{sub}</p>}
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground -mt-0.5">{sub}</p>}
    </div>
  );
}

function Bar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    sent: 'bg-green-500/10 text-green-600',
    sending: 'bg-amber-500/10 text-amber-600',
    draft: 'bg-secondary text-muted-foreground',
    failed: 'bg-red-500/10 text-red-600',
    not_configured: 'bg-secondary text-muted-foreground'
  };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] || map.draft}`}>{status}</span>;
}