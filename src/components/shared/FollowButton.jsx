import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, UserCheck } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { base44 } from '@/api/base44Client';

export default function FollowButton({ targetType, targetId, targetName, size = 'sm' }) {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setUserId(u?.id));
  }, []);

  const { isFollowing, toggle, isPending } = useFollow(userId);
  const following = isFollowing(targetType, targetId);

  if (!userId) return null;

  return (
    <Button
      size={size}
      disabled={isPending}
      onClick={() => toggle(targetType, targetId, targetName)}
      className={`rounded-lg gap-2 transition-all ${
        following
          ? 'bg-secondary text-foreground hover:bg-destructive/10 hover:text-destructive border border-border'
          : 'bg-accent hover:bg-accent/90 text-accent-foreground'
      }`}
    >
      {following ? (
        <><UserCheck className="w-4 h-4" />Following</>
      ) : (
        <><Heart className="w-4 h-4" />Follow</>
      )}
    </Button>
  );
}