import React, { useState, useMemo } from 'react';
import { Gift } from 'lucide-react';
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

  const totalPoints = useMemo(() => {
    return referrals.reduce((sum, r) => sum + (r.points_awarded || 0), 0);
  }, [referrals]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-center hover:opacity-70 transition-opacity"
      >
        <span className="font-bold text-foreground text-sm sm:text-base">{referrals.length}</span>
        <span className="text-xs text-muted-foreground ml-1">Referrals</span>
      </button>

      <ReferralsModal
        userId={userId}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        referralCode={referralCode}
      />
    </>
  );
}