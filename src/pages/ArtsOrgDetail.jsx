import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MapPin, Globe, Phone, Mail, Clock, Shield, Users, Calendar, Pencil, Heart, Share2, ExternalLink, Send, Camera, ChevronDown, Plus, Grid2X2, List, Pin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/shared/PostCard';
import EventCard from '@/components/shared/EventCard';
import FollowButton from '@/components/shared/FollowButton';
import CommentSection from '@/components/shared/CommentSection';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';
import ArtsOrgMessageModal from '@/components/arts/ArtsOrgMessageModal';
import ArtsOrgEditModal from '@/components/arts/ArtsOrgEditModal';
import ArtsOrgCreatePostModal from '@/components/arts/ArtsOrgCreatePostModal';
import ShareModal from '@/components/shared/ShareModal';

const ORG_TYPE_LABELS = {
  museum: 'Museum', gallery: 'Gallery', studio_space: 'Artist Studio Space',
  collective: 'Artist Collective', residency: 'Residency Program', nonprofit: 'Arts Nonprofit',
  cultural_institution: 'Cultural Institution', performance_space: 'Performance Space',
  community_art_space: 'Community Art Space', diy_space: 'DIY / Alt Space',
  art_school: 'Art School', other: 'Other',
};

export default function ArtsOrgDetail() {
  const id = window.location.pathname.split('/').pop();
  const queryClient = useQueryClient();
  const [postView, setPostView] = useState('feed'); // 'feed' | 'grid'
  const [showInvite, setShowInvite] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploading, setUploading] = useState(null); // 'banner' | 'avatar' | null
  const [showNeighborhoodPicker, setShowNeighborhoodPicker] = useState(false);
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);

  const { data: org, isLoading } = useQuery({
    queryKey: ['arts-org', id],
    queryFn: () => base44.entities.ArtsOrganization.get(id),
  });

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => base44.entities.Neighborhood.list('name', 100),
  });

  const isOwner = currentUser?.id === org?.owner_id;

  const uploadImage = async (file, field) => {
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ArtsOrganization.update(id, { [field]: file_url });
    queryClient.invalidateQueries({ queryKey: ['arts-org', id] });
    setUploading(null);
  };

  const handleNeighborhoodSelect = async (neighborhood) => {
    await base44.entities.ArtsOrganization.update(id, {
      neighborhood_id: neighborhood.id,
      neighborhood_name: neighborhood.name,
    });
    queryClient.invalidateQueries({ queryKey: ['arts-org', id] });
    setShowNeighborhoodPicker(false);
  };

  const { data: posts = [] } = useQuery({
    queryKey: ['arts-org-posts', id],
    queryFn: () => base44.entities.Post.filter({ page_id: id }, '-created_date', 20),
    enabled: !!id,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['arts-org-events', org?.name],
    queryFn: () => base44.entities.Event.filter({ organizer_name: org.name }, '-date', 12),
    enabled: !!org?.name,
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-44 rounded-xl" />
      <div className="flex items-center gap-4"><Skeleton className="w-20 h-20 rounded-xl" /><div className="space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div></div>
    </div>
  );

  if (!org) return <div className="text-center py-16 text-muted-foreground">Organization not found.</div>;

  return (
    <div className="space-y-0">
      {/* Banner */}
      <div className="relative h-44 sm:h-56 rounded-xl overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20">
        {org.banner_url && <img src={org.banner_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {isOwner && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploading === 'banner_url'}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {uploading === 'banner_url' ? 'Uploading...' : org.banner_url ? 'Edit banner' : 'Add banner'}
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'banner_url')} />
      </div>

      {/* Profile row */}
      <div className="relative px-1 -mt-10">
        <div className="flex items-end justify-between">
          <div className="relative">
            <Avatar className="w-20 h-20 border-4 border-background rounded-xl cursor-pointer" onClick={isOwner ? () => avatarInputRef.current?.click() : undefined}>
              <AvatarImage src={org.image_url} />
              <AvatarFallback className="rounded-xl text-2xl font-bold bg-accent/10 text-accent">{org.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            {isOwner && (
              <span className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-foreground border-2 border-background flex items-center justify-center shadow-sm cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <Camera className="w-3 h-3 text-background" />
              </span>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'image_url')} />
          </div>
          <div className="flex gap-2 mb-1">
            {org && !isOwner && <FollowButton targetType="arts_org" targetId={org.id} targetName={org.name} />}
            <Button size="sm" variant="outline" onClick={() => setShowShare(true)} className="rounded-lg transition-all duration-150 active:scale-95" aria-label="Share"><Share2 className="w-4 h-4" /></Button>
          </div>
        </div>


        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{org.name}</h1>
            {org.is_verified && <Shield className="w-5 h-5 text-accent" />}
          </div>
          <Badge className="mt-1 bg-accent/10 text-accent border-0 capitalize">{ORG_TYPE_LABELS[org.org_type] || org.org_type}</Badge>
          {org.tagline && <p className="text-sm text-muted-foreground mt-1 italic">{org.tagline}</p>}
          {org.description && <p className="text-sm text-foreground mt-2 leading-relaxed">{org.description}</p>}

          <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
            {isOwner ? (
              <div className="relative">
                <button
                  onClick={() => setShowNeighborhoodPicker(v => !v)}
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {org.neighborhood_name || 'Add neighborhood'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showNeighborhoodPicker && (
                  <div className="absolute top-7 left-0 z-30 bg-card border border-border rounded-xl shadow-xl w-56 max-h-60 overflow-y-auto">
                    {neighborhoods.map(n => (
                      <button
                        key={n.id}
                        onClick={() => handleNeighborhoodSelect(n)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${org.neighborhood_id === n.id ? 'text-accent font-medium' : 'text-foreground'}`}
                      >
                        {n.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              org.neighborhood_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{org.neighborhood_name}</span>
            )}
            {org.website && <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline"><Globe className="w-3.5 h-3.5" />{org.website.replace(/https?:\/\//, '')}</a>}
            {org.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{org.phone}</span>}
            {org.hours && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{org.hours}</span>}
          </div>

          {org.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {org.tags.map((t, i) => <Badge key={i} variant="outline" className="text-xs">#{t}</Badge>)}
            </div>
          )}
        </div>

        <div className="flex gap-6 mt-4 py-3 border-b border-border">
          <div className="text-center"><span className="font-bold text-foreground">{org.followers_count || 0}</span><span className="text-xs text-muted-foreground ml-1">Followers</span></div>
          <div className="text-center"><span className="font-bold text-foreground">{events.length}</span><span className="text-xs text-muted-foreground ml-1">Events</span></div>
          <div className="text-center"><span className="font-bold text-foreground">{posts.length}</span><span className="text-xs text-muted-foreground ml-1">Posts</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4">
        <Tabs defaultValue="posts">
          <TabsList className="w-full bg-secondary/50 rounded-xl">
            <TabsTrigger value="posts" className="flex-1 rounded-lg">Posts</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 rounded-lg">Events</TabsTrigger>
            <TabsTrigger value="invite" className="flex-1 rounded-lg">Invite</TabsTrigger>
            <TabsTrigger value="about" className="flex-1 rounded-lg">About</TabsTrigger>
            <TabsTrigger value="comments" className="flex-1 rounded-lg">Comments</TabsTrigger>
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
              <p className="text-center py-10 text-sm text-muted-foreground">No posts yet.</p>
            ) : postView === 'feed' ? (
              <div className="space-y-4">
                {[...posts].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map(p => (
                  <div key={p.id} className="relative">
                    {p.is_pinned && (
                      <div className="flex items-center gap-1 text-xs text-accent font-medium mb-1 ml-1">
                        <Pin className="w-3 h-3" />Pinned
                      </div>
                    )}
                    <PostCard post={p} currentUserId={currentUser?.id} />
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
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden flex items-center justify-center p-3 text-center cursor-pointer group"
                    style={{ backgroundColor: p.bg_color || 'hsl(var(--secondary))' }}>
                    <p className="text-xs font-medium line-clamp-5" style={{ color: p.bg_color ? '#fff' : 'hsl(var(--foreground))' }}>{p.content}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-4">
            {isOwner && (
              <a
                href={`/create-event?organizer_name=${encodeURIComponent(org.name)}&organizer_id=${org.id}`}
                className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />Create an event for {org.name}
              </a>
            )}
            {events.length === 0
              ? <p className="text-center py-10 text-sm text-muted-foreground">No upcoming events.</p>
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{events.map(e => <EventCard key={e.id} event={e} />)}</div>}
          </TabsContent>

          <TabsContent value="invite" className="mt-4 space-y-3">
            <button
              onClick={() => setShowInvite(true)}
              className="w-full px-4 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              Invite Friends to Planet Baltimore
            </button>
            {currentUser?.id === org?.owner_id && (
              <button
                onClick={() => setShowMessage(true)}
                className="w-full px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Message All Followers
              </button>
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentSection targetType="arts_org" targetId={id} />
          </TabsContent>

          <TabsContent value="about" className="mt-4 space-y-4">
            {isOwner && (
              <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-2">
                <Pencil className="w-3.5 h-3.5" />Edit Info
              </Button>
            )}
            {org.mission && (
              <div className="bg-accent/5 border border-accent/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">Mission</p>
                <p className="text-sm text-foreground leading-relaxed">{org.mission}</p>
              </div>
            )}
            <div className="space-y-3 text-sm">
              {org.address && <div className="flex gap-3"><MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" /><span className="text-foreground">{org.address}</span></div>}
              {org.contact_email && <div className="flex gap-3"><Mail className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" /><a href={`mailto:${org.contact_email}`} className="text-accent hover:underline">{org.contact_email}</a></div>}
              {org.programming_types?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Programming</p>
                  <div className="flex flex-wrap gap-1.5">
                    {org.programming_types.map((pt, i) => <Badge key={i} variant="secondary" className="text-xs capitalize">{pt}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showInvite && <InviteFriendsModal onClose={() => setShowInvite(false)} />}
      {showMessage && <ArtsOrgMessageModal org={org} onClose={() => setShowMessage(false)} />}
      {showEdit && <ArtsOrgEditModal org={org} onClose={() => setShowEdit(false)} />}
      {showCreatePost && currentUser && <ArtsOrgCreatePostModal org={org} user={currentUser} onClose={() => setShowCreatePost(false)} />}
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={window.location.href} title={org.name} description={org.tagline || org.description} />
    </div>
  );
}