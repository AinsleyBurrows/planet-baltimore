import React, { useState } from 'react';
import { Plus, MessageCircle } from 'lucide-react';
import PostCard from '@/components/shared/PostCard';
import ArtistCreatePostModal from '@/components/artist/ArtistCreatePostModal';

export default function PodcastCommunityTab({ artist, posts, isOwner, user }) {
  const [showCreatePost, setShowCreatePost] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Community</h2>
      </div>

      {isOwner && (
        <button
          onClick={() => setShowCreatePost(true)}
          className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-14">
          <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No posts yet.</p>
          {isOwner && <p className="text-xs text-muted-foreground mt-1">Share episode highlights, polls, or behind-the-scenes updates.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p.id} post={p} currentUserId={user?.id} />)}
        </div>
      )}

      {showCreatePost && user && (
        <ArtistCreatePostModal artist={artist} user={user} onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  );
}