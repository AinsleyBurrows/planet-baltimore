import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Mail, Plus, Loader2, CheckCircle2, XCircle, Send, Settings, Ticket } from 'lucide-react';
import ComposeCampaignModal from './ComposeCampaignModal';
import CompTicketsModal from './CompTicketsModal';

const STATUS = {
  draft: { label: 'Draft', Icon: Mail, color: 'text-muted-foreground' },
  sending: { label: 'Sending…', Icon: Loader2, color: 'text-accent' },
  sent: { label: 'Sent', Icon: CheckCircle2, color: 'text-green-600' },
  failed: { label: 'Failed', Icon: XCircle, color: 'text-destructive' },
  not_configured: { label: 'Email not set up', Icon: Settings, color: 'text-amber-600' },
};

export default function EmailCampaignsTab() {
  const { user } = useCurrentUser();
  const [composing, setComposing] = useState(false);
  const [compOpen, setCompOpen] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['email-campaigns', user?.id],
    queryFn: () => base44.entities.EmailCampaign.filter({ owner_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Compose branded invitations and send them to your lists or event attendees.</p>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => setCompOpen(true)} className="flex items-center gap-1.5"><Ticket className="w-4 h-4" /> Comp Tickets</Button>
          <Button onClick={() => setComposing(true)} className="text-white" style={{ backgroundColor: '#d4580a' }}><Plus className="w-4 h-4" /> New Campaign</Button>
        </div>
      </div>

      {isLoading ? <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      : campaigns.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <Send className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-semibold text-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first invitation above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {campaigns.map(c => {
            const st = STATUS[c.status] || STATUS.draft;
            return (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{c.subject || '(no subject)'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">To {c.total_recipients || 0} recipients · {c.sent_count || 0} sent{c.failed_count ? `, ${c.failed_count} failed` : ''}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold ${st.color} shrink-0`}><st.Icon className={`w-4 h-4 ${c.status === 'sending' ? 'animate-spin' : ''}`} />{st.label}</span>
                </div>
                {c.error && <p className="text-xs text-amber-600 mt-2">{c.error}</p>}
              </div>
            );
          })}
        </div>
      )}

      {composing && <ComposeCampaignModal onClose={() => setComposing(false)} />}
      {compOpen && <CompTicketsModal onClose={() => setCompOpen(false)} />}
    </div>
  );
}