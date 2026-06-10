import React from 'react';
import { Pin, PinOff } from 'lucide-react';
import PostGridTile from '@/components/shared/PostGridTile';

export default function PostsGrid({ posts, onSelect, onDelete, onTogglePin }) {
  const visiblePosts = posts.filter(p => !p.is_deleted);
  const pinnedPosts = visiblePosts.filter(p => p.is_pinned);
  const unpinnedPosts = visiblePosts.filter(p => !p.is_pinned);
  const sortedPosts = [...pinnedPosts, ...unpinnedPosts];

  if (!visiblePosts.length) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No posts yet. Share something with the community!</div>;
  }

  return (
    <>
      {pinnedPosts.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
          <Pin className="w-3 h-3" /> {pinnedPosts.length}/9 posts pinned
        </p>
      )}
      <div className="px-3 sm:px-4">
        <div className="grid grid-cols-3 gap-1 sm:gap-2 bg-white">
          {sortedPosts.map(p => (
            <div key={p.id} className="rounded-lg overflow-hidden relative group aspect-square">
              {p.is_pinned && (
                <div className="absolute top-1.5 left-1.5 z-10 bg-accent text-accent-foreground rounded-full p-0.5 shadow-sm">
                  <Pin className="w-2.5 h-2.5" />
                </div>
              )}
              <PostGridTile post={p} onClick={onSelect} onDelete={onDelete} />
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin(p); }}
                className="absolute bottom-2 left-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all z-10"
                title={p.is_pinned ? 'Unpin post' : 'Pin post'}
              >
                {p.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}