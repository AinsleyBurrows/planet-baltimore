import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Users, Globe, Mail, MapPin, CheckCircle, Share2, Bell, Pencil, UserPlus, Camera, MessageSquare, Plus, Grid2X2, List, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import AppImage from '@/components/shared/AppImage';
import PostCard from '@/components/shared/PostCard';
import EventCard from '@/components/shared/EventCard';
import CommentSection from '@/components/shared/CommentSection';
import CommunityEditModal from '@/components/community/CommunityEditModal';
import CommunityInviteModal from '@/components/community/CommunityInviteModal';
import CommunityMessageModal from '@/components/community/CommunityMessageModal';
import ShareModal from '@/components/shared/ShareModal';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';
import CommunityCreatePostModal from '@/components/community/CommunityCreatePostModal';
import CommunityCreateEventModal from '@/components/community/CommunityCreateEventModal';

export default function CommunityDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [joined, setJoined] = useState(false);
  const [user, setUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postView, setPostView] = useState('feed');
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const communityId = window.location.pathname.split('/communities/')[1];

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const uploadImage = async (file, field) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Community.update(communityId, { [field]: file_url });
    queryClient.invalidateQueries({ queryKey: ['community', communityId] });
  };

  const { data: community, isLoading } = useQuery({
    queryKey: ['community', communityId],
    queryFn: async () => {
      const results = await base44.entities.Community.filter({ id: communityId });
      return results[0];
    },
    enabled: !!communityId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts', communityId],
    queryFn: () => base44.entities.Post.filter({ community_id: communityId }, '-created_date', 20),
    enabled: !!communityId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['community-events', communityId],
    queryFn: () => base44.entities.Event.filter({ community_id: communityId }, '-date', 20),
    enabled: !!communityId,
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <div className="flex gap-4 items-end px-4">
        <Skeleton className="w-20 h-20 rounded-xl -mt-10" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  );

  const isOwner = user?.id === community?.owner_id;

  if (!community) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Community not found</p>
      <Button variant="ghost" onClick={() => navigate('/communities')} className="mt-4">Back</Button>
    </div>
  );

  return (
    <div className="space-y-0">
      <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary mb-2 block">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/10">
        {community.banner_url && <AppImage src={community.banner_url} className="w-full h-full" clickable={false} />}
        {isOwner && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {community.banner_url ? 'Edit banner' : 'Add banner'}
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'banner_url')} />
      </div>

      {/* Header */}
      <div className="px-1 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <Avatar className="w-20 h-20 rounded-xl border-4 border-background shadow-lg" onClick={isOwner ? () => avatarInputRef.current?.click() : undefined} style={isOwner ? { cursor: 'pointer' } : {}}>
              <AvatarImage src={community.image_url} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-2xl font-bold">
                {community.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isOwner && (
              <span className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-foreground border-2 border-background flex items-center justify-center shadow-sm cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <Camera className="w-3 h-3 text-background" />
              </span>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'image_url')} />
          </div>
          <div className="flex gap-2 mb-1">
            {isOwner && (
              <>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowEdit(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowInvite(true)}>
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowMessage(true)}>
                  <MessageSquare className="w-3.5 h-3.5" /> Message All
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => setShowShare(true)}><Share2 className="w-4 h-4" /></Button>
            {!isOwner && (
              <Button
                onClick={() => setJoined(!joined)}
                className={`rounded-lg h-9 px-4 gap-2 ${joined ? 'bg-secondary text-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
              >
                {joined ? <><Bell className="w-4 h-4" />Joined</> : <><Users className="w-4 h-4" />Join</>}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">{community.name}</h1>
          {community.is_verified && <CheckCircle className="w-5 h-5 text-accent fill-accent/20" />}
          {community.is_official && <Badge className="bg-primary/10 text-primary border-0 text-xs">Official</Badge>}
        </div>

        {community.category && (
          <Badge variant="secondary" className="mb-2 capitalize">{community.category}</Badge>
        )}

        {community.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{community.description}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{(community.members_count || 0).toLocaleString()} members</span>
          {community.neighborhood_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{community.neighborhood_name}</span>}
          {community.website && <a href={community.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline"><Globe className="w-4 h-4" />Website</a>}
          {community.contact_email && <a href={`mailto:${community.contact_email}`} className="flex items-center gap-1 text-accent hover:underline"><Mail className="w-4 h-4" />{community.contact_email}</a>}
        </div>

        {community.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {community.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="w-full bg-secondary/50 rounded-xl">
          <TabsTrigger value="posts" className="flex-1 rounded-lg">Posts</TabsTrigger>
          <TabsTrigger value="events" className="flex-1 rounded-lg">Events</TabsTrigger>
          <TabsTrigger value="invite" className="flex-1 rounded-lg">Invite</TabsTrigger>
          <TabsTrigger value="comments" className="flex-1 rounded-lg">Comments</TabsTrigger>
          <TabsTrigger value="about" className="flex-1 rounded-lg">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            {isOwner ? (
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-3 py-1.5 rounded-lg border border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />New Post
              </button>
            ) : <div />}
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setPostView('feed')}
                className={`p-1.5 rounded-md transition-colors ${postView === 'feed' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                aria-label="Feed view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPostView('grid')}
                className={`p-1.5 rounded-md transition-colors ${postView === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                aria-label="Grid view"
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No posts yet in this community.</div>
          ) : postView === 'feed' ? (
            <div className="space-y-4">
              {[...posts].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map(post => (
                <div key={post.id} className="relative">
                  {post.is_pinned && (
                    <div className="flex items-center gap-1 text-xs text-accent font-medium mb-1 ml-1">
                      <Pin className="w-3 h-3" />Pinned
                    </div>
                  )}
                  <PostCard post={post} currentUserId={user?.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {posts.filter(p => p.media_urls?.length > 0).map(p => {
                const isVideo = p.media_type === 'video' || p.media_urls?.[0]?.match(/\.(mp4|webm|mov)/i);
                return (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-secondary relative group cursor-pointer">
                    {isVideo ? (
                      <video src={p.media_urls[0]} className="w-full h-full object-cover" muted preload="metadata" />
                    ) : (
                      <img src={p.media_urls[0]} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                      <p className="text-white text-xs line-clamp-2">{p.content}</p>
                    </div>
                  </div>
                );
              })}
              {posts.filter(p => !p.media_urls?.length).map(p => (
                <div key={p.id} className="aspect-square rounded-xl flex items-center justify-center p-3 text-center cursor-pointer"
                  style={{ backgroundColor: p.bg_color || 'hsl(var(--secondary))' }}>
                  <p className="text-xs font-medium line-clamp-5" style={{ color: p.bg_color ? '#fff' : 'hsl(var(--foreground))' }}>{p.content}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-3">
          {isOwner && (
            <button
              onClick={() => setShowCreateEvent(true)}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />Create an Event
            </button>
          )}
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No events yet.</div>
          ) : events.map(event => (
            <div key={event.id} className="relative group">
              <EventCard event={event} compact />
              {isOwner && (
                <button
                  onClick={() => setEditingEvent(event)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/80 hover:bg-background border border-border opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  aria-label="Edit event"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="invite" className="mt-4">
          <button onClick={() => setShowInviteFriends(true)} className="w-full px-4 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors">
            Invite Friends
          </button>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentSection targetType="community" targetId={communityId} />
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">About</h3>
              <p className="text-sm text-muted-foreground">{community.description}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Organizer</h3>
              <p className="text-sm text-muted-foreground">{community.owner_name}</p>
            </div>
            {community.neighborhood_name && (
              <div>
                <h3 className="font-semibold text-foreground mb-1">Neighborhood</h3>
                <p className="text-sm text-muted-foreground">{community.neighborhood_name}</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {showCreatePost && user && <CommunityCreatePostModal community={community} user={user} onClose={() => setShowCreatePost(false)} />}
      {showCreateEvent && user && <CommunityCreateEventModal community={community} user={user} onClose={() => setShowCreateEvent(false)} />}
      {editingEvent && <CommunityCreateEventModal community={community} user={user} event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {showEdit && <CommunityEditModal community={community} onClose={() => setShowEdit(false)} />}
      {showInvite && <CommunityInviteModal community={community} onClose={() => setShowInvite(false)} />}
      {showInviteFriends && <InviteFriendsModal onClose={() => setShowInviteFriends(false)} />}
      {showMessage && <CommunityMessageModal community={community} onClose={() => setShowMessage(false)} />}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        url={`${window.location.origin}/communities/${communityId}`}
        title={community.name}
        description={community.description}
      />
    </div>
  );
}