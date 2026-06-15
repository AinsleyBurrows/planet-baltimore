import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Gift, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ReferralsModal from './ReferralsModal';

export default function ReferralsCard({ userId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', userId],
    queryFn: () => base44.entities.Referral.filter({ referrer_id: userId }),
  });

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => base44.entities.User.get(userId),
  });

  // Generate referral code if not exists
  const referralCode = user?.referral_code || userId.substring(0, 8).toUpperCase();

  const activeCount = referrals.filter(r => r.status === 'active').length;
  const totalPoints = useMemo(() => {
    return referrals.reduce((sum, r) => sum + (r.points_awarded || 0), 0);
  }, [referrals]);

  // Check if user is at max tier (3)
  const userTier = referrals.length > 0 ? referrals[0].tier : 1;
  const isMaxTier = userTier >= 3;

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer hover:shadow-lg transition-shadow"
      >
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <Users className="w-6 h-6 text-accent" />
                {isMaxTier && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-destructive" />}
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Referrals</p>
            <p className="text-3xl font-bold text-foreground">{referrals.length}</p>
            <div className="flex items-center justify-center gap-1">
              <Gift className="w-3 h-3 text-gold" />
              <p className="text-xs font-semibold text-gold">{totalPoints} pts</p>
            </div>
            {isMaxTier && <p className="text-xs text-destructive">Max depth reached</p>}
          </div>
        </CardContent>
      </Card>

      <ReferralsModal
        userId={userId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        referralCode={referralCode}
      />
    </>
  );
}