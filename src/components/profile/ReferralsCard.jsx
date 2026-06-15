import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
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

  return (
    <>
      <Card
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer hover:shadow-lg transition-shadow"
      >
        <CardContent className="p-6">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Referrals</p>
            <p className="text-3xl font-bold text-foreground">{referrals.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeCount} active</p>
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