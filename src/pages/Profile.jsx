import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Share2, MapPin, LinkIcon, Shield, Plus, Grid3X3, Rss, BookOpen, Calendar, Image, Camera, CalendarCheck, Trash2, Pin, PinOff, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PostCard from '@/components/shared/PostCard';
import EventCard from '@/components/shared/EventCard';
import StoryCard from '@/components/shared/StoryCard';
import AppImage from '@/components/shared/AppImage';
import PostGridTile from '@/components/shared/PostGridTile';
import PostDetailModal from '@/components/shared/PostDetailModal';
import ImageUploadModal from '@/components/profile/ImageUploadModal';
import ShareModal from '@/components/shared/ShareModal';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';

const tabs = [
  { id: 'posts', label: 'Posts', icon: Grid3X3 },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'stories', label: 'Your Story', icon: BookOpen },
  { id: 'events', label: 'My Events', icon: CalendarCheck },
  { id: 'created_events', label: 'Organized', icon: Calendar },

];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingImage, setEditingImage] = useState(null); // 'avatar' | 'banner' | null
  const [showShare, setShowShare] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleDeletePost = async (postId) => {
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ['my-posts', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['home-posts'] });
  };

  const handleDeleteStory = async (storyId) => {
    await base44.entities.Story.delete(storyId);
    queryClient.invalidateQueries({ queryKey: ['my-stories', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['stories'] });
  };

  const handleTogglePin = async (post) => {
    const pinnedPosts = posts.filter(p => p.is_pinned && !p.is_deleted);
    if (!post.is_pinned && pinnedPosts.length >= 3) {
      alert('You can only pin up to 3 posts. Unpin one first.');
      return;
    }
    await base44.entities.Post.update(post.id, { is_pinned: !post.is_pinned });
    queryClient.invalidateQueries({ queryKey: ['my-posts', user?.id] });
  };

  const handleDeleteEvent = async (eventId) => {
    await base44.entities.Event.delete(eventId);
    queryClient.invalidateQueries({ queryKey: ['my-created-events', user?.id] });
  };

  const { data: posts = [] } = useQuery({
    queryKey: ['my-posts', user?.id],
    queryFn: () => base44.entities.Post.filter({ author_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  const { data: stories = [] } = useQuery({
    queryKey: ['my-stories', user?.id],
    queryFn: () => base44.entities.Story.filter({ author_id: user.id }, '-created_date', 20),
    enabled: !!user?.id,
  });

  const { data: createdEvents = [] } = useQuery({
    queryKey: ['my-created-events', user?.id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: user.id }, '-date', 20),
    enabled: !!user?.id,
  });

  const { data: myRsvps = [] } = useQuery({
    queryKey: ['my-rsvps', user?.id],
    queryFn: () => base44.entities.RSVP.filter({ user_id: user.id }),
    enabled: !!user?.id,
  });

  const rsvpEventIds = myRsvps.map(r => r.event_id);

  const { data: rsvpedEvents = [] } = useQuery({
    queryKey: ['rsvped-events', rsvpEventIds.join(',')],
    queryFn: async () => {
      if (!rsvpEventIds.length) return [];
      const all = await base44.entities.Event.list('date', 200);
      return all.filter(e => rsvpEventIds.includes(e.id));
    },
    enabled: rsvpEventIds.length > 0,
  });

  if (!user) return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <div className="flex items-center gap-4"><Skeleton className="w-20 h-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24" /></div></div>
    </div>
  );

  const mediaPosts = posts.filter(p => p.media_urls?.length > 0 && p.media_type !== 'audio');
  const allMedia = mediaPosts.flatMap(p => p.media_urls.filter(url => !url.match(/\.(mp4|webm|mov|avi|mp3|wav|ogg|aac)$/i)));

  return (
    <>
    <div className="space-y-0">
      {/* Banner */}
      <div className="relative sm:h-56 rounded-xl overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20" style={{height: '145px'}}>
        {user.banner_url && <img src={`${user.banner_url}?t=${Date.now()}`} alt="Banner" className="w-full h-full object-cover" />}
        <button
          onClick={() => setEditingImage('banner')}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          {user.banner_url ? 'Edit banner' : 'Add banner'}
        </button>
      </div>

      {/* Profile Info */}
      <div className="relative px-1" style={{marginTop: '15px'}}>
        <div className="flex items-end justify-between">
          <div className="relative cursor-pointer" onClick={() => setEditingImage('avatar')}>
            <Avatar key={user.avatar_url} className="border-4 border-background" style={{width: '75px', height: '75px'}}>
              <AvatarImage src={user.avatar_url ? `${user.avatar_url}?t=${Date.now()}` : undefined} />
              <AvatarFallback className="text-2xl font-bold bg-accent/10 text-accent">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {/* Always-visible camera badge — like Twitter/Instagram */}
            <span className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-foreground border-2 border-background flex items-center justify-center shadow-sm">
              <Camera className="w-3.5 h-3.5 text-background" />
            </span>
          </div>
          <div className="flex gap-1 mb-1 justify-end">
            <Link to="/create-post">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg w-8 h-8 p-0">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInvite(true)}
              className="rounded-lg transition-all duration-150 active:scale-95 w-8 h-8 p-0"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="Share profile"
              onClick={() => setShowShare(true)}
              className="rounded-lg transition-all duration-150 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-foreground" style={{fontSize: '14px'}}>{user.display_name || user.full_name}</h1>
            {user.is_verified && <Shield className="w-5 h-5 text-accent" />}
          </div>
          {user.bio && <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {user.neighborhood_names?.length > 0 && (
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{user.neighborhood_names[0]}</span>
            )}
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline">
                <LinkIcon className="w-3.5 h-3.5" />{user.website.replace(/https?:\/\//, '')}
              </a>
            )}
            {user.account_type && (
              <Badge variant="secondary" className="capitalize text-xs">{user.account_type.replace('_', ' ')}</Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 py-3 border-b border-border">
          <div className="text-center"><span className="font-bold text-foreground">{user.posts_count || posts.length}</span><span className="text-xs text-muted-foreground ml-1">Posts</span></div>
          <div className="text-center"><span className="font-bold text-foreground">{user.followers_count || 0}</span><span className="text-xs text-muted-foreground ml-1">Followers</span></div>
          <div className="text-center"><span className="font-bold text-foreground">{user.following_count || 0}</span><span className="text-xs text-muted-foreground ml-1">Following</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mt-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-4 space-y-4">
        {activeTab === 'posts' && (
          (() => {
            const visiblePosts = posts.filter(p => !p.is_deleted);
            const pinnedPosts = visiblePosts.filter(p => p.is_pinned);
            const unpinnedPosts = visiblePosts.filter(p => !p.is_pinned);
            const sortedPosts = [...pinnedPosts, ...unpinnedPosts];
            if (!visiblePosts.length) return (
              <div className="text-center py-12 text-muted-foreground text-sm">No posts yet. Share something with the community!</div>
            );
            return (
              <>
                {pinnedPosts.length > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 px-1">
                    <Pin className="w-3 h-3" /> {pinnedPosts.length}/3 posts pinned
                  </p>
                )}
                <div className="grid grid-cols-3 gap-1 bg-white">
                  {sortedPosts.map(p => (
                    <div key={p.id} className="rounded-lg overflow-hidden relative group">
                      {p.is_pinned && (
                        <div className="absolute top-1.5 left-1.5 z-10 bg-accent text-accent-foreground rounded-full p-0.5 shadow-sm">
                          <Pin className="w-2.5 h-2.5" />
                        </div>
                      )}
                      <PostGridTile post={p} onClick={setSelectedPost} onDelete={handleDeletePost} />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTogglePin(p); }}
                        className="absolute bottom-2 left-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all z-10"
                        title={p.is_pinned ? 'Unpin post' : 'Pin post'}
                      >
                        {p.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            );
          })()
        )}
        {activeTab === 'feed' && (
          posts.filter(p => !p.is_deleted).length > 0 ? (
            posts.filter(p => !p.is_deleted).map(p => <PostCard key={p.id} post={p} currentUserId={user.id} onDelete={handleDeletePost} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">Your activity feed is empty.</div>
          )
        )}
        {activeTab === 'stories' && (
          stories.length > 0 ? (
            stories.map(s => (
              <div key={s.id} className="relative group">
                <StoryCard story={s} />
                <button
                  onClick={() => { if (window.confirm('Delete this story?')) handleDeleteStory(s.id); }}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  aria-label="Delete story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No stories published yet.</div>
          )
        )}
        {activeTab === 'events' && (
          (() => {
            const going = myRsvps.filter(r => r.status === 'going').map(r => r.event_id);
            const interested = myRsvps.filter(r => r.status === 'interested').map(r => r.event_id);
            const goingEvents = rsvpedEvents.filter(e => going.includes(e.id));
            const interestedEvents = rsvpedEvents.filter(e => interested.includes(e.id));
            if (!rsvpedEvents.length) return <div className="text-center py-12 text-muted-foreground text-sm">No RSVPs yet. Find events to attend!</div>;
            return (
              <div className="space-y-6">
                {goingEvents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" />Going ({goingEvents.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {goingEvents.map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                  </div>
                )}
                {interestedEvents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Interested ({interestedEvents.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {interestedEvents.map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
        {activeTab === 'created_events' && (
          createdEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {createdEvents.map(e => (
                <div key={e.id} className="relative group">
                  <EventCard event={e} />
                  <button
                    onClick={() => { if (window.confirm('Delete this event?')) handleDeleteEvent(e.id); }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    aria-label="Delete event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No events organized yet.</div>
          )
        )}
        {activeTab === 'media' && (
          mediaPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 bg-white">
              {mediaPosts.map((post) => {
                const isVideo = post.media_type === 'video' || post.media_urls?.[0]?.match(/\.(mp4|webm|mov|avi)/i);
                if (isVideo) {
                  const thumb = post.thumbnail_url || post.media_urls?.[0];
                  return (
                    <div key={post.id} className="rounded-lg overflow-hidden relative aspect-square bg-black">
                      {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={post.media_urls?.[0]} className="w-full h-full object-cover" preload="metadata" muted />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                          <span className="text-white text-xs ml-0.5">▶</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return post.media_urls.filter(url => !url.match(/\.(mp4|webm|mov|avi|mp3|wav|ogg|aac)$/i)).map((url, idx) => (
                  <div key={`${post.id}-${idx}`} className="rounded-lg overflow-hidden">
                    <AppImage src={url} images={allMedia} index={allMedia.indexOf(url)} className="aspect-square w-full" aspectRatio="square" />
                  </div>
                ));
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No media shared yet.</div>
          )
        )}

      </div>
    </div>

    {showInvite && <InviteFriendsModal onClose={() => setShowInvite(false)} />}
    {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}

    <ShareModal
      isOpen={showShare}
      onClose={() => setShowShare(false)}
      url={window.location.href}
      title={user?.display_name || user?.full_name}
      description={user?.bio}
    />

    {editingImage && (
      <ImageUploadModal
        type={editingImage}
        onSave={async (fileUrl) => {
          // Optimistically update the displayed image immediately
          const field = editingImage === 'banner' ? 'banner_url' : 'avatar_url';
          setUser(prev => ({ ...prev, [field]: fileUrl }));
          setEditingImage(null);
          // Re-fetch after a short delay to allow backend to propagate
          await new Promise(res => setTimeout(res, 600));
          const updated = await base44.auth.me();
          setUser(updated);
        }}
        onClose={() => setEditingImage(null)}
      />
    )}
    </>
  );
}