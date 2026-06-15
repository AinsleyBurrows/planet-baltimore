import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Mail, Link2, Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReferralInviteForm from './ReferralInviteForm';

const ReferralNode = ({ referral, level = 0 }) => {
  const { data: childReferrals = [] } = useQuery({
    queryKey: ['referrals', referral.referred_user_id],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: referral.referred_user_id }),
    enabled: !!referral.referred_user_id && level < 2,
  });

  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
  };

  const tierPoints = { 1: 5, 2: 3, 3: 1 };
  const points = tierPoints[referral.tier] || 0;

  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
        <Avatar className="h-8 w-8">
          <AvatarImage src={referral.referred_avatar} />
          <AvatarFallback>{referral.referred_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{referral.referred_name || 'Unknown'}</p>
            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Tier {referral.tier}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {referral.referral_type === 'email' ? (
              <Mail className="w-3 h-3 text-muted-foreground" />
            ) : (
              <Link2 className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground">
              {referral.joined_at ? new Date(referral.joined_at).toLocaleDateString() : 'Invited'}
            </span>
            {referral.status === 'active' && (
              <div className="flex items-center gap-1">
                <Gift className="w-3 h-3 text-gold" />
                <span className="text-xs font-semibold text-gold">+{points} pts</span>
              </div>
            )}
          </div>
        </div>
        <Badge className={statusColors[referral.status]}>
          {referral.status}
        </Badge>
      </div>

      {childReferrals.length > 0 && level < 2 && (
        <div className="border-l border-border/50">
          {childReferrals.map((child) => (
            <ReferralNode key={child.id} referral={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function ReferralsModal({ userId, isOpen, onOpenChange, referralCode }) {
  const [copied, setCopied] = useState(false);

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', userId],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: userId }),
    enabled: isOpen && !!userId,
  });

  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Referral Network</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tier Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-black mb-2">How it works</p>
            <div className="space-y-1 text-black text-xs">
              <p>Tier 1: You get <strong>5 points</strong> per active referral</p>
              <p>Tier 2: Your invitees earn <strong>3 points</strong> per their referral</p>
              <p>Tier 3: Their invitees earn <strong>1 point</strong> (chain ends)</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground">Total Invited</p>
              <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">
                {referrals.filter(r => r.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-gold/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Points Earned</p>
              <p className="text-2xl font-bold text-gold">
                {referrals.reduce((sum, r) => sum + (r.points_awarded || 0), 0)}
              </p>
            </div>
          </div>

          {/* Invite Form */}
          <div className="border-t border-border pt-4">
            <ReferralInviteForm userId={userId} referralCode={referralCode} />
          </div>

          {/* Referral Tree */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {referrals.length > 0 ? 'People You Invited' : 'No invites yet'}
            </p>
            {referrals.length > 0 && (
              <div className="border border-border rounded-lg p-3 space-y-1">
                {referrals.map((referral) => (
                  <ReferralNode key={referral.id} referral={referral} />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}