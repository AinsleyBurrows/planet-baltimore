import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ROLE_COLORS = {
  admin: 'bg-accent/10 text-accent border-accent/20',
  mod: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-secondary text-secondary-foreground border-border',
};

export default function CommunityMembersTab({ community }) {
  const [search, setSearch] = useState('');

  const { data: follows = [] } = useQuery({
    queryKey: ['community-follows', community.id],
    queryFn: () => base44.entities.Follow.filter({ target_type: 'community', target_id: community.id }, '-created_date', 100),
    enabled: !!community.id,
  });

  const filtered = follows.filter(f =>
    !search || f.target_name?.toLowerCase().includes(search.toLowerCase())
  );

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
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No members found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((f, i) => {
            const role = getRole(f);
            return (
              <Link key={i} to={`/profile/${f.follower_id}`} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:shadow-sm transition-all">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarFallback className="bg-accent/10 text-accent font-semibold text-sm">
                    {f.follower_id?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.follower_id}</p>
                  {f.created_date && <p className="text-xs text-muted-foreground">Joined {format(new Date(f.created_date), 'MMM yyyy')}</p>}
                </div>
                <Badge variant="outline" className={`text-xs capitalize ${ROLE_COLORS[role]}`}>{role}</Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}