import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ROLE_COLORS = {
  admin: 'bg-accent/10 text-accent border-accent/20',
  mod: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-secondary text-secondary-foreground border-border',
};

export default function CommunityMembersTab({ community, isOwner }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: follows = [] } = useQuery({
    queryKey: ['community-follows', community.id],
    queryFn: () => base44.entities.Follow.filter({ target_type: 'community', target_id: community.id }, '-created_date', 100),
    enabled: !!community.id,
  });

  const featuredIds = community.hub_data?.featured_members || [];

  const toggleFeatured = async (followerId) => {
    const current = community.hub_data?.featured_members || [];
    const updated = current.includes(followerId)
      ? current.filter(id => id !== followerId)
      : [...current, followerId];
    await base44.entities.Community.update(community.id, {
      hub_data: { ...(community.hub_data || {}), featured_members: updated }
    });
    queryClient.invalidateQueries({ queryKey: ['community', community.id] });
  };

  const filtered = follows.filter(f =>
    !search || f.target_name?.toLowerCase().includes(search.toLowerCase()) || f.follower_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Featured members first
  const sorted = [...filtered].sort((a, b) => {
    const aFeat = featuredIds.includes(a.follower_id) ? -1 : 0;
    const bFeat = featuredIds.includes(b.follower_id) ? -1 : 0;
    return aFeat - bFeat;
  });

  const getRole = (f) => {
    if (f.follower_id === community.owner_id) return 'admin';
    return 'member';
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-input bg-background text-sm"
          placeholder="Search members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{follows.length} member{follows.length !== 1 ? 's' : ''}</span>
        {featuredIds.length > 0 && (
          <span className="flex items-center gap-1 ml-2 text-foreground font-medium">
            <Star className="w-3.5 h-3.5 fill-foreground" />{featuredIds.length} featured
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((f, i) => {
            const role = getRole(f);
            const isFeatured = featuredIds.includes(f.follower_id);
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl bg-card border transition-all ${isFeatured ? 'border-foreground/30 shadow-sm' : 'border-border'}`}>
                <Link to={`/profile/${f.follower_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-secondary text-foreground font-semibold text-sm">
                        {f.follower_id?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {isFeatured && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                        <Star className="w-2.5 h-2.5 text-background fill-background" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{f.target_name || f.follower_id}</p>
                      {isFeatured && <span className="text-xs text-muted-foreground font-normal">· Featured</span>}
                    </div>
                    {f.created_date && <p className="text-xs text-muted-foreground">Joined {format(new Date(f.created_date), 'MMM yyyy')}</p>}
                  </div>
                  <Badge variant="outline" className={`text-xs capitalize flex-shrink-0 ${ROLE_COLORS[role]}`}>{role}</Badge>
                </Link>
                {isOwner && (
                  <button
                    onClick={() => toggleFeatured(f.follower_id)}
                    title={isFeatured ? 'Remove featured' : 'Feature member'}
                    className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${isFeatured ? 'text-foreground bg-secondary hover:bg-destructive/10 hover:text-destructive' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                  >
                    <Star className={`w-4 h-4 ${isFeatured ? 'fill-foreground' : ''}`} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}