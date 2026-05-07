import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// mode: 'followers' | 'following'
export default function FollowersModal({ userId, mode, onClose }) {
  const { data: follows = [], isLoading } = useQuery({
    queryKey: ['follows-modal', userId, mode],
    queryFn: async () => {
      if (mode === 'followers') {
        // People who follow this user
        return base44.entities.Follow.filter({ target_type: 'user', target_id: userId }, '-created_date', 100);
      } else {
        // People/things this user follows
        return base44.entities.Follow.filter({ follower_id: userId }, '-created_date', 100);
      }
    },
    enabled: !!userId,
  });

  const title = mode === 'followers' ? 'Followers' : 'Following';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="w-full sm:max-w-sm bg-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold text-foreground">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-muted border-t-accent rounded-full animate-spin" />
              </div>
            ) : follows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Users className="w-8 h-8 opacity-30" />
                <p className="text-sm">{mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {follows.map(follow => {
                  const name = mode === 'followers' ? follow.follower_name : follow.target_name;
                  const targetId = mode === 'followers' ? follow.follower_id : follow.target_id;
                  const targetType = mode === 'following' ? follow.target_type : 'user';

                  const linkPath = targetType === 'user' ? `/profile/${targetId}`
                    : targetType === 'artist' ? `/artists/${targetId}`
                    : targetType === 'business' ? `/businesses/${targetId}`
                    : targetType === 'community' ? `/communities/${targetId}`
                    : targetType === 'arts_org' ? `/arts-organizations/${targetId}`
                    : `/profile/${targetId}`;

                  return (
                    <Link
                      key={follow.id}
                      to={linkPath}
                      onClick={onClose}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-secondary transition-colors"
                    >
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarImage src={follow.actor_avatar} />
                        <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                          {name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name || 'Unknown'}</p>
                        {mode === 'following' && targetType !== 'user' && (
                          <p className="text-xs text-muted-foreground capitalize">{targetType.replace('_', ' ')}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}