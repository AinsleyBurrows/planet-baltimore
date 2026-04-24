import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Settings, Share2, MapPin, LinkIcon, Shield, Plus, Grid3X3, Rss, BookOpen, Calendar, Image, Camera, CalendarCheck } from 'lucide-react';
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

const tabs = [
  { id: 'posts', label: 'Posts', icon: Grid3X3 },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'stories', label: 'Your Story', icon: BookOpen },
  { id: 'events', label: 'My Events', icon: CalendarCheck },
  { id: 'created_events', label: 'Organized', icon: Calendar },
  { id: 'media', label: 'Media', icon: Image },
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingImage, setEditingImage] = useState(null); // 'avatar' | 'banner' | null

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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

  const mediaPosts = posts.filter(p => p.media_urls?.length > 0);
  const allMedia = mediaPosts.flatMap(p => p.media_urls);

  return (
    <>
    <div className="space-y-0">
      {/* Banner */}
      <div className="relative h-44 sm:h-56 rounded-xl overflow-hidden bg-gradient-to-r from-primary/20 to-accent/20">
        {user.banner_url && <img src={user.banner_url} alt="Banner" className="w-full h-full object-cover" />}
        <button
          onClick={() => setEditingImage('banner')}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors shadow-sm"
        >
          <Camera className="w-3.5 h-3.5" />
          {user.banner_url ? 'Edit banner' : 'Add banner'}
        </button>
      </div>

      {/* Profile Info */}
      <div className="relative px-1 -mt-12">
        <div className="flex items-end justify-between">
          <div className="relative cursor-pointer" onClick={() => setEditingImage('avatar')}>
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback className="text-2xl font-bold bg-accent/10 text-accent">
                {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            {/* Always-visible camera badge — like Twitter/Instagram */}
            <span className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-foreground border-2 border-background flex items-center justify-center shadow-sm">
              <Camera className="w-3.5 h-3.5 text-background" />
            </span>
          </div>
          <div className="flex gap-2 mb-1">
            <Link to="/create-post">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5 rounded-lg">
                <Plus className="w-4 h-4" />Create Post
              </Button>
            </Link>
            <Button size="sm" variant="outline" aria-label="Settings" className="rounded-lg transition-all duration-150 active:scale-95"><Settings className="w-4 h-4" /></Button>
            <Button
              size="sm"
              variant="outline"
              aria-label="Share profile"
              onClick={() => navigator.share?.({ title: user.full_name, url: window.location.href }).catch(() => {})}
              className="rounded-lg transition-all duration-150 active:scale-95"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{user.display_name || user.full_name}</h1>
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
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 ${activeTab === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-4 space-y-4">
        {activeTab === 'posts' && (
          posts.filter(p => !p.is_deleted).length > 0 ? (
            <div className="grid grid-cols-3 gap-1 bg-white">
              {posts.filter(p => !p.is_deleted).map(p => (
                <div key={p.id} className="rounded-lg overflow-hidden">
                  <PostGridTile post={p} onClick={setSelectedPost} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No posts yet. Share something with the community!</div>
          )
        )}
        {activeTab === 'feed' && (
          posts.filter(p => !p.is_deleted).length > 0 ? (
            posts.filter(p => !p.is_deleted).map(p => <PostCard key={p.id} post={p} currentUserId={user.id} />)
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">Your activity feed is empty.</div>
          )
        )}
        {activeTab === 'stories' && (
          stories.length > 0 ? (
            stories.map(s => <StoryCard key={s.id} story={s} />)
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
              {createdEvents.map(e => <EventCard key={e.id} event={e} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No events organized yet.</div>
          )
        )}
        {activeTab === 'media' && (
          allMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 bg-white">
              {allMedia.map((url, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden">
                  <AppImage src={url} images={allMedia} index={idx} className="aspect-square w-full" aspectRatio="square" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">No media shared yet.</div>
          )
        )}

      </div>
    </div>

    {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />}

    {editingImage && (
      <ImageUploadModal
        type={editingImage}
        onSave={(url) => {
          setUser(prev => ({
            ...prev,
            [editingImage === 'avatar' ? 'avatar_url' : 'banner_url']: url,
          }));
          setEditingImage(null);
        }}
        onClose={() => setEditingImage(null)}
      />
    )}
    </>
  );
}