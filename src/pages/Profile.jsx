import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Share2, MapPin, LinkIcon, Shield, Plus, Grid3X3, Rss, Calendar, Camera, CalendarCheck, Trash2, Pin, PinOff, UserPlus, Music, BookOpen, UserCheck, ChevronDown, Pencil, Bookmark, MessageCircle, Ticket } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PostCard from '@/components/shared/PostCard';
import EventCard from '@/components/shared/EventCard';

import AppImage from '@/components/shared/AppImage';
import PostGridTile from '@/components/shared/PostGridTile';
import PostDetailModal from '@/components/shared/PostDetailModal';
import ImageUploadModal from '@/components/profile/ImageUploadModal';
import ShareModal from '@/components/shared/ShareModal';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';
import BroadcastModal from '@/components/messages/BroadcastModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import PostsGrid from '@/components/profile/PostsGrid';
import RSVPEvents from '@/components/profile/RSVPEvents';
import StoryCard from '@/components/shared/StoryCard';
import MyPagesTab from '@/components/profile/MyPagesTab';
import FollowersModal from '@/components/profile/FollowersModal';
import MyTicketsTab from '@/components/profile/MyTicketsTab';
import FoundingMemberBadge from '@/components/shared/FoundingMemberBadge.jsx';

const tabs = [
  { id: 'posts', label: 'Posts', icon: Grid3X3 },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'writings', label: 'My Writings', icon: BookOpen },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'events', label: 'Attending', icon: CalendarCheck },
  { id: 'created_events', label: 'Organized', icon: Calendar },
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
  { id: 'pages', label: 'My Pages', icon: Shield },
];

export default function Profile() {
  const profileId = window.location.pathname.split('/').pop();
  const isOwnProfile = !profileId || profileId === 'profile';
  
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const [editingImage, setEditingImage] = useState(null); // 'avatar' | 'banner' | null
  const [showShare, setShowShare] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(null); // 'followers' | 'following' | null
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: actualFollowersCount } = useQuery({
    queryKey: ['followers-count', user?.id],
    queryFn: async () => {
      const follows = await base44.entities.Follow.filter({ target_type: 'user', target_id: user.id });
      return follows.length;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', currentUser?.id, user?.id],
    queryFn: async () => {
      if (!currentUser?.id || !user?.id || currentUser.id === user.id) return null;
      const follows = await base44.entities.Follow.filter({ 
        follower_id: currentUser.id,
        target_type: 'user',
        target_id: user.id
      });
      return follows.length > 0;
    },
    enabled: !!currentUser?.id && !!user?.id && currentUser.id !== user.id,
    staleTime: 30000,
  });

  useEffect(() => {
    if (followStatus !== undefined) {
      setIsFollowing(followStatus);
    }
  }, [followStatus]);

  useEffect(() => {
    if (isOwnProfile) {
      setUser(currentUser);
    } else if (profileId && profileId !== 'profile') {
      base44.entities.User.get(profileId).then(setUser).catch(() => setUser(null));
    }
  }, [profileId, isOwnProfile, currentUser]);

  const handleDeletePost = async (postId) => {
    await base44.entities.Post.delete(postId);
    queryClient.invalidateQueries({ queryKey: ['my-posts', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['home-posts'] });
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

  const handleToggleFollow = async () => {
    if (!currentUser || currentUser.id === user.id) return;
    if (isFollowing) {
      const follows = await base44.entities.Follow.filter({ 
        follower_id: currentUser.id,
        target_type: 'user',
        target_id: user.id
      });
      if (follows.length > 0) {
        await base44.entities.Follow.delete(follows[0].id);
      }
      // Update follower count on target user and following count on current user
      await Promise.all([
        base44.entities.User.update(user.id, { followers_count: Math.max(0, (user.followers_count || 0) - 1) }),
        base44.entities.User.update(currentUser.id, { following_count: Math.max(0, (currentUser.following_count || 0) - 1) }),
      ]);
      setUser(prev => ({ ...prev, followers_count: Math.max(0, (prev.followers_count || 0) - 1) }));
    } else {
      await base44.entities.Follow.create({
        follower_id: currentUser.id,
        target_type: 'user',
        target_id: user.id,
        target_name: user.full_name,
      });
      // Update follower count on target user and following count on current user
      await Promise.all([
        base44.entities.User.update(user.id, { followers_count: (user.followers_count || 0) + 1 }),
        base44.entities.User.update(currentUser.id, { following_count: (currentUser.following_count || 0) + 1 }),
      ]);
      setUser(prev => ({ ...prev, followers_count: (prev.followers_count || 0) + 1 }));
    }
    setIsFollowing(!isFollowing);
    queryClient.invalidateQueries({ queryKey: ['follow-status', currentUser?.id, user?.id] });
  };

  const handleDeleteEvent = async (eventId) => {
    await base44.entities.Event.delete(eventId);
    queryClient.invalidateQueries({ queryKey: ['my-created-events', user?.id] });
  };

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => base44.entities.Neighborhood.list('name', 500),
    staleTime: 300000,
  });

  const handleNeighborhoodSelect = async (neighborhood) => {
    const updated = await base44.auth.updateMe({
      neighborhoods: [neighborhood.id],
      neighborhood_names: [neighborhood.name],
    });
    setUser(prev => ({ ...prev, neighborhoods: [neighborhood.id], neighborhood_names: [neighborhood.name] }));
    setShowNeighborhoodPicker(false);
  };

  const { data: posts = [] } = useQuery({
    queryKey: ['my-posts', user?.id],
    queryFn: () => base44.entities.Post.filter({ author_id: user.id, page_type: 'personal' }, '-created_date', 50),
    enabled: !!user?.id,
    staleTime: 30000,
  });



  const { data: createdEvents = [] } = useQuery({
    queryKey: ['my-created-events', user?.id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: user.id }, '-date', 20),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const { data: myRsvps = [] } = useQuery({
    queryKey: ['my-rsvps', user?.id],
    queryFn: () => base44.entities.RSVP.filter({ user_id: user.id }),
    enabled: !!user?.id,
    staleTime: 30000,
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
    staleTime: 30000,
  });

  const { data: userStories = [] } = useQuery({
    queryKey: ['user-stories', user?.id],
    queryFn: () => base44.entities.Story.filter({ author_id: user.id }, '-created_date', 50),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const { data: savedStoryRecords = [] } = useQuery({
    queryKey: ['saved-stories-profile', user?.id],
    queryFn: () => base44.entities.SavedStory.filter({ user_id: user.id }, '-created_date', 50),
    enabled: !!user?.id && isOwnProfile,
    staleTime: 30000,
  });

  const savedStoryIds = savedStoryRecords.map(s => s.story_id);

  const { data: savedStories = [] } = useQuery({
    queryKey: ['saved-stories-data', savedStoryIds.join(',')],
    queryFn: async () => {
      if (!savedStoryIds.length) return [];
      const all = await base44.entities.Story.list('-created_date', 200);
      return all.filter(s => savedStoryIds.includes(s.id));
    },
    enabled: savedStoryIds.length > 0,
    staleTime: 30000,
  });

  const { data: savedPostRecords = [] } = useQuery({
    queryKey: ['saved-posts-profile', user?.id],
    queryFn: () => base44.entities.SavedPost.filter({ user_id: user.id }, '-created_date', 50),
    enabled: !!user?.id && isOwnProfile,
    staleTime: 30000,
  });

  const savedPostIds = savedPostRecords.map(s => s.post_id);

  const { data: savedPosts = [] } = useQuery({
    queryKey: ['saved-posts-data', savedPostIds.join(',')],
    queryFn: async () => {
      if (!savedPostIds.length) return [];
      const all = await base44.entities.Post.list('-created_date', 200);
      return all.filter(p => savedPostIds.includes(p.id) && !p.is_deleted);
    },
    enabled: savedPostIds.length > 0,
    staleTime: 30000,
  });

  const handleDeleteStory = async (storyId) => {
    await base44.entities.Story.delete(storyId);
    queryClient.invalidateQueries({ queryKey: ['user-stories', user?.id] });
  };

  if (!user) return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <div className="flex items-center gap-4"><Skeleton className="w-20 h-20 rounded-full" /><div className="space-y-2"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24" /></div></div>
    </div>
  );

  const mediaPosts = posts.filter(p => p.media_urls?.length > 0 && p.media_type !== 'audio');
  const allMedia = mediaPosts.flatMap(p => p.media_urls.filter(url => !url.match(/\.(mp4|webm|mov|avi|mp3|wav|ogg|aac)$/i)));

  // Sorted list used for the posts grid — same order as PostsGrid
  const visiblePosts = posts.filter(p => !p.is_deleted);
  const sortedPosts = [...visiblePosts.filter(p => p.is_pinned), ...visiblePosts.filter(p => !p.is_pinned)];
  const selectedPost = selectedPostIndex !== null ? sortedPosts[selectedPostIndex] : null;

  return (
    <>
    <div className="space-y-0">
      {/* Banner */}
      <div className="px-0 sm:px-4">
        <div className="relative sm:h-56 rounded-none sm:rounded-xl overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20" style={{height: '145px'}}>
          {user.banner_url && <img src={`${user.banner_url}?t=${Date.now()}`} alt="Banner" className="w-full h-full object-cover" />}
          {isOwnProfile && (
            <button
              onClick={() => setEditingImage('banner')}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              {user.banner_url ? 'Edit banner' : 'Add banner'}
            </button>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="relative px-3 sm:px-4" style={{marginTop: '2rem'}}>
        <div className="flex items-end justify-between">
           <div className={isOwnProfile ? "relative cursor-pointer" : "relative"} onClick={() => isOwnProfile && setEditingImage('avatar')}>
             <Avatar key={user.avatar_url} className="border-4 border-background aspect-square w-[98px] h-[98px]">
               <AvatarImage src={user.avatar_url ? `${user.avatar_url}?t=${Date.now()}` : undefined} />
               <AvatarFallback className="text-xl sm:text-2xl font-bold bg-accent/10 text-accent">
                 {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
               </AvatarFallback>
             </Avatar>
             {/* Always-visible camera badge — like Twitter/Instagram */}
             {isOwnProfile && (
               <span className="absolute bottom-0.5 right-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-foreground border-2 border-background flex items-center justify-center shadow-sm">
                 <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-background" />
               </span>
             )}
           </div>
          <div className="flex gap-1 mb-1 justify-end">
            {isOwnProfile && (
              <Link to="/create-story">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg w-8 h-8 p-0" title="Write a story">
                  <BookOpen className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {isOwnProfile && (
              <Link to="/create-post?from=profile">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg w-8 h-8 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </Link>
            )}
            {isOwnProfile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEditProfile(true)}
                className="rounded-lg transition-all duration-150 active:scale-95 w-8 h-8 p-0"
                title="Edit Profile"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {isOwnProfile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBroadcast(true)}
                className="rounded-lg transition-all duration-150 active:scale-95 w-8 h-8 p-0"
                title="Message followers"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
            {isOwnProfile && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowInvite(true)}
                className="rounded-lg transition-all duration-150 active:scale-95 w-8 h-8 p-0"
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            )}
            {!isOwnProfile && currentUser && (
              <Button
                size="sm"
                variant={isFollowing ? "default" : "outline"}
                onClick={handleToggleFollow}
                className={`rounded-lg transition-all duration-150 active:scale-95 gap-1.5 ${isFollowing ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="hidden sm:inline">{isFollowing ? 'Following' : 'Follow'}</span>
              </Button>
            )}
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

        <div className="mt-3 sm:mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-foreground text-sm sm:text-base">{user.display_name || user.full_name}</h1>
            {user.is_verified && <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />}
            {user.is_founding_member && <FoundingMemberBadge />}
          </div>
          {user.website && (
            <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline text-sm mt-1">
              <LinkIcon className="w-3.5 h-3.5" />{user.website.replace(/https?:\/\//, '')}
            </a>
          )}
          {isOwnProfile ? (
            <div className="relative mt-1">
              <button
                onClick={() => setShowNeighborhoodPicker(v => !v)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{user.neighborhood_names?.[0] || 'Add neighborhood'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showNeighborhoodPicker && (
                <div className="absolute top-7 left-0 z-30 bg-card border border-border rounded-xl shadow-xl w-56 max-h-60 overflow-y-auto">
                  {neighborhoods.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNeighborhoodSelect(n)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${user.neighborhood_names?.[0] === n.name ? 'text-accent font-medium' : 'text-foreground'}`}
                    >
                      {n.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            user.neighborhood_names?.length > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><MapPin className="w-3.5 h-3.5" />{user.neighborhood_names[0]}</span>
            )
          )}
          {user.bio && <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>}
          {user.account_type && (
            <div className="mt-2"><Badge variant="secondary" className="capitalize text-xs">{user.account_type.replace('_', ' ')}</Badge></div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 sm:gap-8 mt-4 py-3 border-b border-border">
          <div className="text-center"><span className="font-bold text-foreground text-sm sm:text-base">{user.posts_count || posts.length}</span><span className="text-xs text-muted-foreground ml-1">Posts</span></div>
          <button onClick={() => setShowFollowModal('followers')} className="text-center hover:opacity-70 transition-opacity">
            <span className="font-bold text-foreground text-sm sm:text-base">{actualFollowersCount ?? user.followers_count ?? 0}</span>
            <span className="text-xs text-muted-foreground ml-1">Followers</span>
          </button>
          <button onClick={() => setShowFollowModal('following')} className="text-center hover:opacity-70 transition-opacity">
            <span className="font-bold text-foreground text-sm sm:text-base">{user.following_count || 0}</span>
            <span className="text-xs text-muted-foreground ml-1">Following</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mt-3 overflow-x-auto gap-0.5">
        {tabs.filter(tab => (tab.id !== 'pages' && tab.id !== 'tickets') || isOwnProfile).map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 ${activeTab === tab.id ? 'border-[#d4580a] text-[#d4580a]' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" /><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-[10px] space-y-4">
        {activeTab === 'posts' && <PostsGrid posts={posts} onSelect={(post) => setSelectedPostIndex(sortedPosts.findIndex(p => p.id === post.id))} onDelete={handleDeletePost} onTogglePin={handleTogglePin} />}
        {activeTab === 'feed' && (
          posts.filter(p => !p.is_deleted).length > 0 ? (
            posts.filter(p => !p.is_deleted).map(p => <PostCard key={p.id} post={p} currentUserId={user.id} onDelete={handleDeletePost} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">Your activity feed is empty.</div>
          )
        )}

        {activeTab === 'saved' && isOwnProfile && (
          savedPosts.length === 0 && savedStories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No saved items yet. Bookmark posts and stories to find them here.</div>
          ) : (
            <div className="space-y-4">
              {savedPosts.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Posts</p>
                  {savedPosts.map(p => <PostCard key={p.id} post={p} currentUserId={user?.id} />)}
                </div>
              )}
              {savedStories.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Stories</p>
                  {savedStories.map(story => <StoryCard key={story.id} story={story} />)}
                </div>
              )}
            </div>
          )
        )}

        {activeTab === 'writings' && (
          userStories.length > 0 ? (
            <div className="space-y-4">
              {userStories.map(story => (
                <div key={story.id} className="relative group">
                  <StoryCard story={story} />
                  {isOwnProfile && (
                    <button
                      onClick={() => { if (window.confirm('Delete this story?')) handleDeleteStory(story.id); }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                      aria-label="Delete story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No stories yet. Start writing!</div>
          )
        )}

        {activeTab === 'events' && <RSVPEvents myRsvps={myRsvps} rsvpedEvents={rsvpedEvents} />}
        {activeTab === 'created_events' && (
          createdEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
        {activeTab === 'tickets' && isOwnProfile && (
          <MyTicketsTab userId={user?.id} />
        )}
        {activeTab === 'pages' && isOwnProfile && (
          <MyPagesTab userId={user?.id} />
        )}


      </div>
    </div>

    {showFollowModal && <FollowersModal userId={user?.id} mode={showFollowModal} onClose={() => setShowFollowModal(null)} />}
    {showInvite && <InviteFriendsModal onClose={() => setShowInvite(false)} />}
    {showBroadcast && <BroadcastModal currentUser={user} onClose={() => setShowBroadcast(false)} />}
    {showEditProfile && (
      <EditProfileModal
        user={user}
        onClose={() => setShowEditProfile(false)}
        onSave={(updated) => setUser(prev => ({ ...prev, ...updated }))}
      />
    )}
    {selectedPost && (
      <PostDetailModal
        post={selectedPost}
        posts={sortedPosts}
        currentIndex={selectedPostIndex}
        onNavigate={(idx) => setSelectedPostIndex(idx)}
        onClose={() => setSelectedPostIndex(null)}
      />
    )}

    <ShareModal
      isOpen={showShare}
      onClose={() => setShowShare(false)}
      url={`${window.location.origin}/profile/${user?.id}`}
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