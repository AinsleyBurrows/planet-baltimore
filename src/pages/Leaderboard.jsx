import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, FileText, MessageCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const MEDAL = ['🥇', '🥈', '🥉'];

function LeaderSkeleton() {
  return Array(10).fill(0).map((_, i) => (
    <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
      <Skeleton className="w-8 h-8 rounded-full" />
      <Skeleton className="w-11 h-11 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-12 rounded-lg" />
    </div>
  ));
}

export default function Leaderboard() {
  const { data: settings = [] } = useQuery({
    queryKey: ['leaderboard-reset'],
    queryFn: () => base44.entities.PlatformSettings.list(),
    staleTime: 60000,
  });

  const resetAt = settings.find(s => s.key === 'leaderboard_reset_at')?.value || null;

  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['leaderboard-posts', resetAt],
    queryFn: () => base44.entities.Post.filter({ page_type: 'personal' }, '-created_date', 2000),
    staleTime: 60000,
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['leaderboard-comments', resetAt],
    queryFn: () => base44.entities.Comment.list('-created_date', 2000),
    staleTime: 60000,
  });

  const isLoading = loadingPosts || loadingComments;

  const leaderboard = useMemo(() => {
    const scoreMap = {};
    const since = resetAt ? new Date(resetAt) : null;

    const filteredPosts = since ? posts.filter(p => new Date(p.created_date) >= since) : posts;
    const filteredComments = since ? comments.filter(c => new Date(c.created_date) >= since) : comments;

    filteredPosts.forEach(p => {
      const id = p.author_id;
      if (!id) return;
      if (!scoreMap[id]) scoreMap[id] = { id, name: p.author_name || 'Unknown', avatar: p.author_avatar, posts: 0, comments: 0, likes: 0 };
      scoreMap[id].posts += 1;
      scoreMap[id].likes += p.likes_count || 0;
      // keep most recent avatar
      if (p.author_avatar) scoreMap[id].avatar = p.author_avatar;
    });

    filteredComments.forEach(c => {
      const id = c.author_id;
      if (!id) return;
      if (!scoreMap[id]) scoreMap[id] = { id, name: c.author_name || 'Unknown', avatar: c.author_avatar, posts: 0, comments: 0, likes: 0 };
      scoreMap[id].comments += 1;
      if (c.author_avatar) scoreMap[id].avatar = c.author_avatar;
    });

    return Object.values(scoreMap)
      .map(m => ({ ...m, score: m.posts * 5 + m.comments * 2 + m.likes }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);
  }, [posts, comments]);

  return (
    <div className="space-y-6 pb-10">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-5 sm:p-8 lg:p-12 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1.5" style={{ color: '#d4580a' }}>Baltimore <span className="text-black dark:text-white">100</span></h1>
          <p className="text-muted-foreground text-sm">Top 100 active Planet Baltimore members</p>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full translate-y-1/2 -translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Points key */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground bg-secondary/60 rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> <strong className="text-foreground">5</strong> / post</span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> <strong className="text-foreground">2</strong> / comment</span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> <strong className="text-foreground">1</strong> / like received</span>
      </div>

      {isLoading ? (
        <div className="space-y-3"><LeaderSkeleton /></div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No activity yet to rank.</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((m, i) => (
            <Link
              key={m.id}
              to={`/profile/${m.id}`}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:shadow-sm transition-all active:scale-[0.99]"
            >
              <span className="w-8 text-center font-bold flex-shrink-0 text-sm text-muted-foreground">#{i + 1}</span>
              <Avatar className="w-11 h-11 flex-shrink-0">
                <AvatarImage src={m.avatar} />
                <AvatarFallback className="bg-accent/10 text-accent font-bold text-sm">{m.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{m.name}</p>
                <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5"><FileText className="w-3 h-3" />{m.posts}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{m.comments}</span>
                  <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{m.likes}</span>
                </div>
              </div>
              <span className="font-bold text-sm text-accent flex-shrink-0">{m.score} pts</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}