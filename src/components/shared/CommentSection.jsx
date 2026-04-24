import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommentSection({ targetType, targetId }) {
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  const qKey = ['comments', targetType, targetId];

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: comments = [] } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.Comment.filter({ target_type: targetType, target_id: targetId }, 'created_date', 100),
    enabled: !!targetId,
  });

  const addMutation = useMutation({
    mutationFn: () => base44.entities.Comment.create({
      content: text.trim(),
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      target_type: targetType,
      target_id: targetId,
    }),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    addMutation.mutate();
  };

  const visible = comments.filter(c => !c.is_deleted);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-accent" />
        Comments {visible.length > 0 && <span className="text-muted-foreground font-normal text-sm">({visible.length})</span>}
      </h3>

      {/* Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{user.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 text-sm bg-secondary rounded-xl px-3 py-2 outline-none border border-transparent focus:border-ring placeholder:text-muted-foreground"
              maxLength={500}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!text.trim() || addMutation.isPending}
              className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0 h-9 w-9"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to leave a comment.</p>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {visible.map(comment => (
          <div key={comment.id} className="flex gap-3 group">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={comment.author_avatar} />
              <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">{comment.author_name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="bg-secondary rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-foreground">{comment.author_name || 'Anonymous'}</p>
                <p className="text-sm text-foreground mt-0.5 break-words">{comment.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-3">
                {comment.created_date ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true }) : ''}
              </p>
            </div>
            {user?.id === comment.author_id && (
              <button
                onClick={() => deleteMutation.mutate(comment.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0 mt-1"
                aria-label="Delete comment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}