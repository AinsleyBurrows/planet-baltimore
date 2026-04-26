import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Users, Globe, Mail, MapPin, CheckCircle, Share2, Bell, Pencil, UserPlus } from 'lucide-react';
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

export default function CommunityDetail() {
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [user, setUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const communityId = window.location.pathname.split('/communities/')[1];

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

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
    queryKey: ['community-events', community?.neighborhood_name],
    queryFn: () => base44.entities.Event.filter({ neighborhood_name: community.neighborhood_name }, '-date', 6),
    enabled: !!community?.neighborhood_name,
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
      </div>

      {/* Header */}
      <div className="px-1 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <Avatar className="w-20 h-20 rounded-xl border-4 border-background shadow-lg">
            <AvatarImage src={community.image_url} className="object-cover" />
            <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-2xl font-bold">
              {community.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2 mb-1">
            {isOwner && (
              <>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowEdit(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowInvite(true)}>
                  <UserPlus className="w-3.5 h-3.5" /> Invite
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9"><Share2 className="w-4 h-4" /></Button>
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
          <TabsTrigger value="comments" className="flex-1 rounded-lg">Comments</TabsTrigger>
          <TabsTrigger value="about" className="flex-1 rounded-lg">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No posts yet in this community.</div>
          ) : posts.map(post => <PostCard key={post.id} post={post} />)}
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No upcoming events nearby.</div>
          ) : events.map(event => <EventCard key={event.id} event={event} compact />)}
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

      {showEdit && <CommunityEditModal community={community} onClose={() => setShowEdit(false)} />}
      {showInvite && <CommunityInviteModal community={community} onClose={() => setShowInvite(false)} />}
    </div>
  );
}