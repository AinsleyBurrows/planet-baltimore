import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, Send, MessageCircle, Reply, Edit2, Check, X, ImagePlus, Loader2, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

function CommentInput({ user, onSubmit, isPending, placeholder = 'Add a comment…', autoFocus = false, onCancel }) {
  const [text, setText] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (files) => {
    setUploading(true);
    const isVideo = files[0]?.type.startsWith('video/');
    const uploaded = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    setMediaUrls(prev => [...prev, ...uploaded]);
    setMediaType(isVideo ? 'video' : 'image');
    setUploading(false);
  };

  const removeMedia = (idx) => setMediaUrls(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && mediaUrls.length === 0) return;
    onSubmit(text.trim(), mediaUrls, mediaType);
    setText('');
    setMediaUrls([]);
    setMediaType(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-start">
      <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={user.avatar_url} />
        <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{user.full_name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        {mediaUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-secondary">
                {mediaType === 'video'
                  ? <video src={url} className="w-full h-full object-cover" />
                  : <img src={url} alt="" className="w-full h-full object-cover" />
                }
                <button type="button" onClick={() => removeMedia(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="flex-1 text-sm bg-secondary rounded-xl px-3 py-2 outline-none border border-transparent focus:border-ring placeholder:text-muted-foreground"
            maxLength={1000}
          />
          <Button type="button" size="icon" variant="ghost" disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl flex-shrink-0 h-9 w-9 text-muted-foreground hover:text-accent">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          </Button>
          <Button type="submit" size="icon" disabled={(!text.trim() && mediaUrls.length === 0) || isPending || uploading}
            className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground flex-shrink-0 h-9 w-9">
            <Send className="w-4 h-4" />
          </Button>
          {onCancel && (
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} className="rounded-xl flex-shrink-0 h-9 w-9">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden"
          onChange={e => e.target.files?.length && handleUpload(e.target.files)} />
      </div>
    </form>
  );
}

function EditInput({ initialValue, onSave, onCancel, isPending }) {
  const [text, setText] = useState(initialValue);
  return (
    <div className="flex gap-2 mt-1">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        autoFocus
        className="flex-1 text-sm bg-secondary rounded-xl px-3 py-2 outline-none border border-ring placeholder:text-muted-foreground"
        maxLength={1000}
      />
      <Button size="icon" disabled={!text.trim() || isPending} onClick={() => onSave(text.trim())}
        className="rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground h-9 w-9">
        <Check className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onCancel} className="rounded-xl h-9 w-9">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

function CommentItem({ comment, user, replies, allReplies, onDelete, onEdit, onReply, depth = 0 }) {
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);

  const isAuthor = user?.id === comment.author_id;

  return (
    <div className={`flex gap-3 group ${depth > 0 ? 'ml-10 mt-2' : ''}`}>
      <Link to={`/profile/${comment.author_id}`} className="flex-shrink-0 mt-0.5">
        <Avatar className="w-8 h-8 hover:opacity-80 transition-opacity">
          <AvatarImage src={comment.author_avatar} />
          <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">{comment.author_name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="bg-secondary rounded-xl px-3 py-2">
          <Link to={`/profile/${comment.author_id}`} className="text-xs font-semibold text-foreground hover:text-accent transition-colors">{comment.author_name || 'Anonymous'}</Link>
          {editing ? (
            <EditInput
              initialValue={comment.content}
              onSave={(val) => { onEdit(comment.id, val); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {comment.content && <p className="text-sm text-foreground mt-0.5 break-words">{comment.content}</p>}
              {comment.media_urls?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {comment.media_urls.map((url, i) => (
                    <div key={i} className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                      {comment.media_type === 'video'
                        ? <video src={url} controls className="w-full h-full object-cover" />
                        : <a href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" /></a>
                      }
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-3 mt-1 ml-1">
          <p className="text-xs text-muted-foreground">
            {comment.created_date ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true }) : ''}
          </p>
          {user && depth === 0 && (
            <button onClick={() => setShowReply(v => !v)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
              <Reply className="w-3 h-3" /> Reply
            </button>
          )}
          {isAuthor && !editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors opacity-0 group-hover:opacity-100">
              <Edit2 className="w-3 h-3" /> Edit
            </button>
          )}
          {isAuthor && (
            <button onClick={() => onDelete(comment.id)}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-0.5 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
        </div>

        {/* Reply input */}
        {showReply && user && (
          <div className="mt-2">
            <CommentInput
              user={user}
              onSubmit={(text, mediaUrls, mediaType) => { onReply(comment.id, text, mediaUrls, mediaType); setShowReply(false); }}
              placeholder={`Reply to ${comment.author_name}…`}
              autoFocus
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}

        {/* Nested replies */}
        {replies?.length > 0 && (
          <div className="mt-2 space-y-2 border-l-2 border-border pl-3">
            {replies.map(reply => (
              <CommentItem
                key={reply.id}
                comment={reply}
                user={user}
                replies={[]}
                allReplies={allReplies}
                onDelete={onDelete}
                onEdit={onEdit}
                onReply={onReply}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ targetType, targetId }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const qKey = ['comments', targetType, targetId];

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: comments = [] } = useQuery({
    queryKey: qKey,
    queryFn: () => base44.entities.Comment.filter({ target_type: targetType, target_id: targetId }, 'created_date', 200),
    enabled: !!targetId,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, content }) => base44.entities.Comment.update(id, { content }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const handleAdd = (text, mediaUrls = [], mediaType = null) => {
    if (!user) return;
    addMutation.mutate({
      content: text,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      target_type: targetType,
      target_id: targetId,
      ...(mediaUrls.length > 0 && { media_urls: mediaUrls, media_type: mediaType }),
    });
  };

  const handleReply = (parentId, text, mediaUrls = [], mediaType = null) => {
    if (!user) return;
    addMutation.mutate({
      content: text,
      author_id: user.id,
      author_name: user.full_name,
      author_avatar: user.avatar_url,
      target_type: targetType,
      target_id: targetId,
      parent_id: parentId,
      ...(mediaUrls.length > 0 && { media_urls: mediaUrls, media_type: mediaType }),
    });
  };

  const handleEdit = (id, content) => editMutation.mutate({ id, content });
  const handleDelete = (id) => deleteMutation.mutate(id);

  const visible = comments.filter(c => !c.is_deleted);
  const topLevel = visible.filter(c => !c.parent_id);
  const replies = visible.filter(c => !!c.parent_id);

  return (
    <div className="space-y-5">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-accent" />
        Comments
        {visible.length > 0 && <span className="text-muted-foreground font-normal text-sm">({visible.length})</span>}
      </h3>

      {user ? (
        <CommentInput user={user} onSubmit={handleAdd} isPending={addMutation.isPending} />
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to leave a comment.</p>
      )}

      <div className="space-y-4">
        {topLevel.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            user={user}
            replies={replies.filter(r => r.parent_id === comment.id)}
            allReplies={replies}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onReply={handleReply}
          />
        ))}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}