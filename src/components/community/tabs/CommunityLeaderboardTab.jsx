import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, MessageCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CommunityLeaderboardTab({ community }) {
  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts', community.id],
    queryFn: () => base44.entities.Post.filter({ community_id: community.id }, '-created_date', 200),
    enabled: !!community.id,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['community-comments', community.id],
    queryFn: () => base44.entities.Comment.filter({ target_type: 'community', target_id: community.id }, '-created_date', 200),
    enabled: !!community.id,
  });

  // Tally scores: posts = 5pts, comments = 2pts, likes received = 1pt
  const scoreMap = {};
  posts.forEach(p => {
    const id = p.author_id;
    if (!id) return;
    if (!scoreMap[id]) scoreMap[id] = { id, name: p.author_name || id, posts: 0, comments: 0, likes: 0 };
    scoreMap[id].posts += 1;
    scoreMap[id].likes += p.likes_count || 0;
  });
  comments.forEach(c => {
    const id = c.author_id;
    if (!id) return;
    if (!scoreMap[id]) scoreMap[id] = { id, name: c.author_name || id, posts: 0, comments: 0, likes: 0 };
    scoreMap[id].comments += 1;
  });

  const leaderboard = Object.values(scoreMap)
    .map(m => ({ ...m, score: m.posts * 5 + m.comments * 2 + m.likes }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  const medalColors = ['text-yellow-500', 'text-gray-400', 'text-orange-400'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 rounded-xl p-3">
        <Trophy className="w-4 h-4 text-accent" />
        <span>Points: <strong className="text-foreground">5</strong> per post · <strong className="text-foreground">2</strong> per comment · <strong className="text-foreground">1</strong> per like received</span>
      </div>

      {leaderboard.length === 0 ? (
        <p className="text-center py-12 text-sm text-muted-foreground">No activity yet to rank.</p>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((m, i) => (
            <Link key={m.id} to={`/profile/${m.id}`} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:shadow-sm transition-all">
              <span className={`w-6 text-center font-bold text-sm flex-shrink-0 ${medalColors[i] || 'text-muted-foreground'}`}>
                {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
              </span>
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarFallback className="bg-accent/10 text-accent font-semibold text-sm">{m.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{m.name}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5"><FileText className="w-3 h-3" />{m.posts}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{m.comments}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Trophy className="w-3.5 h-3.5 text-accent" />
                <span className="font-bold text-sm text-accent">{m.score}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}