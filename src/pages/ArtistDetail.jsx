import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Globe, MapPin, CheckCircle, Share2, Users,
  Layers, Flame, FileText, Calendar, Mail, MessageCircle, LayoutGrid,
  Camera, Pencil, MessageSquare, Plus, Zap, TrendingUp, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import FollowButton from '@/components/shared/FollowButton';
import CommentSection from '@/components/shared/CommentSection';
import ArtistContactForm from '@/components/artist/ArtistContactForm';
import ShareModal from '@/components/shared/ShareModal';
import ArtistEditProfileModal from '@/components/artist/ArtistEditProfileModal';
import ArtistMessageModal from '@/components/artist/ArtistMessageModal';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';

// New feature tabs
import ArtistSeriesTab from '@/components/artist/ArtistSeriesTab';
import ArtistStudioJournal from '@/components/artist/ArtistStudioJournal';
import ArtistCreateEvent from '@/components/artist/ArtistCreateEvent';
import PageEventsTab from '@/components/shared/PageEventsTab';
import LookbookTab from '@/components/artist/fashion/LookbookTab';
import DropsTab from '@/components/artist/fashion/DropsTab';
import CollabCallsTab from '@/components/artist/fashion/CollabCallsTab';
import ArtistGallery from '@/components/artist/ArtistGallery';
import ArtistCreatePostModal from '@/components/artist/ArtistCreatePostModal';
import PostCard from '@/components/shared/PostCard';
import PageAdminBar from '@/components/shared/PageAdminBar';
import ArtistCVTab from '@/components/artist/ArtistCVTab';
import FoundingMemberBadge from '@/components/shared/FoundingMemberBadge.jsx';

import PodcastEpisodesTab from '@/components/artist/podcast/PodcastEpisodesTab';
import PodcastGuestsTab from '@/components/artist/podcast/PodcastGuestsTab';
import PodcastListenOnTab from '@/components/artist/podcast/PodcastListenOnTab';
import PodcastCommunityTab from '@/components/artist/podcast/PodcastCommunityTab';
import PodcastDashboardTab from '@/components/artist/podcast/PodcastDashboardTab';

// Music-specific tabs
import DiscographyTab from '@/components/artist/music/DiscographyTab';
import TracksTab from '@/components/artist/music/TracksTab';
import TourDatesTab from '@/components/artist/music/TourDatesTab';
import MusicVideosTab from '@/components/artist/music/MusicVideosTab';
import EPKTab from '@/components/artist/music/EPKTab';
import BookingTab from '@/components/artist/music/BookingTab';
import StreamingLinksTab from '@/components/artist/music/StreamingLinksTab';

// Performance-specific tabs
import RepertoireTab from '@/components/artist/performance/RepertoireTab';
import ShowreelTab from '@/components/artist/performance/ShowreelTab';
import PerformancesTab from '@/components/artist/performance/PerformancesTab';
import ReviewsTab from '@/components/artist/performance/ReviewsTab';
import PerformanceBookingTab from '@/components/artist/performance/PerformanceBookingTab';

const categoryLabels = {
  visual_art: 'Visual Art', music: 'Music', video: 'Video', photography: 'Photography',
  performance: 'Performance', literary: 'Literary', mixed_media: 'Mixed Media', digital: 'Digital', fashion: 'Fashion', podcaster: 'Podcaster', other: 'Other'
};

const socialIcons = {
  instagram: '📸', twitter: '🐦', tiktok: '🎵', youtube: '▶️', soundcloud: '☁️', bandcamp: '🎸', linkedin: '💼'
};

export default function ArtistDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const artistId = window.location.pathname.split('/artists/')[1];
  const [user, setUser] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  const uploadImage = async (file, field) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ArtistPage.update(artistId, { [field]: file_url });
    queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
  };

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => base44.entities.ArtistPage.get(artistId),
    enabled: !!artistId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['artist-posts', artistId],
    queryFn: () => base44.entities.Post.filter({ page_id: artistId, page_type: 'artist' }, '-created_date', 30),
    enabled: !!artistId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['artist-events', artist?.owner_id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: artist.owner_id }, '-date', 20),
    enabled: !!artist?.owner_id,
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-52 rounded-xl" />
      <div className="px-4 flex gap-4 items-end -mt-12">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2 pb-1"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24" /></div>
      </div>
      <div className="space-y-3 px-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
    </div>
  );

  if (!artist) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Artist not found</p>
      <Button variant="ghost" onClick={() => navigate('/artists')} className="mt-4">Back to Artists</Button>
    </div>
  );

  const isOwner = user?.id === artist.owner_id;
  const isPlatformAdmin = user?.role === 'admin';
  const isMusic = artist.category === 'music';
  const isFashion = artist.category === 'fashion';
  const isPodcaster = artist.category === 'podcaster';
  const isPerformance = artist.category === 'performance';

  const handleDelete = async () => {
    await base44.entities.ArtistPage.delete(artistId);
    navigate('/artists');
  };

  const handleMute = async (reason) => {
    await base44.entities.ArtistPage.update(artistId, { is_muted: true, mute_reason: reason });
    queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
  };

  const handleUnmute = async () => {
    await base44.entities.ArtistPage.update(artistId, { is_muted: false, mute_reason: '' });
    queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
  };
  const mediaPosts = posts.filter(p => p.media_urls?.length > 0 && p.media_type !== 'audio');
  const upcomingCount = events.filter(e => e.date && new Date(e.date) > new Date()).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {isOwner && (
          <Badge className="bg-accent/10 text-accent border-0 text-xs">Your Artist Page</Badge>
        )}
      </div>

      {/* Banner */}
      <div className="relative h-52 rounded-xl overflow-hidden bg-secondary">
        {artist.banner_url && <img src={artist.banner_url} alt="Banner" className="w-full h-full object-cover" />}
        {artist.category && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm text-xs capitalize">
              {categoryLabels[artist.category] || artist.category}
            </Badge>
          </div>
        )}
        {isOwner && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {artist.banner_url ? 'Edit banner' : 'Add banner'}
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'banner_url')} />
      </div>

      {/* Profile header */}
       <div className="px-1 pb-4" style={{marginTop: '2rem'}}>
         <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <Avatar className="w-20 h-20 rounded-full border-4 border-background shadow-lg cursor-pointer" onClick={isOwner ? () => avatarInputRef.current?.click() : undefined}>
              <AvatarImage src={artist.image_url} className="object-cover" />
              <AvatarFallback className="bg-accent/10 text-accent text-2xl font-bold">{artist.name?.charAt(0)}</AvatarFallback>
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
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowEditProfile(true)}>
                  <Pencil className="w-3.5 h-3.5" />Edit Profile
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowMessage(true)}>
                  <MessageSquare className="w-3.5 h-3.5" />Message All
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => setShowShare(true)}>
              <Share2 className="w-4 h-4" />
            </Button>
            {!isOwner && artist && <FollowButton targetType="artist" targetId={artist.id} targetName={artist.name} />}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">{artist.name}</h1>
          {artist.is_verified && <CheckCircle className="w-5 h-5 text-accent fill-accent/20" />}
          {artist.is_founding_member && <FoundingMemberBadge />}
          {isPlatformAdmin && (
            <button
              onClick={async () => {
                await base44.entities.ArtistPage.update(artistId, { is_founding_member: !artist.is_founding_member });
                queryClient.invalidateQueries({ queryKey: ['artist', artistId] });
              }}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${artist.is_founding_member ? 'border-yellow-400 text-yellow-600 hover:bg-yellow-50' : 'border-muted text-muted-foreground hover:border-yellow-400 hover:text-yellow-600'}`}
            >
              {artist.is_founding_member ? '★ Remove Founding' : '☆ Grant Founding'}
            </button>
          )}
        </div>

        {artist.bio && <p className="text-sm text-muted-foreground leading-relaxed mt-1.5 line-clamp-3">{artist.bio}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{(artist.followers_count || 0).toLocaleString()} followers</span>
          {artist.neighborhood_name && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{artist.neighborhood_name}</span>}
          {artist.website && (
            <a href={artist.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline">
              <Globe className="w-3.5 h-3.5" />Website
            </a>
          )}
        </div>

        {/* Social links */}
        {artist.social_links && Object.keys(artist.social_links).length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {Object.entries(artist.social_links).map(([platform, url]) => url && (
              <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors capitalize">
                {socialIcons[platform] || '🔗'} {platform}
              </a>
            ))}
          </div>
        )}

        {artist.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {artist.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>)}
          </div>
        )}

        <PageAdminBar
          isOwner={isOwner}
          isPlatformAdmin={isPlatformAdmin}
          isMuted={artist.is_muted}
          muteReason={artist.mute_reason}
          onDelete={handleDelete}
          onMute={handleMute}
          onUnmute={handleUnmute}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={isMusic ? "discography" : isFashion ? "lookbook" : isPodcaster ? "episodes" : isPerformance ? "repertoire" : "journal"}>
        <TabsList className="w-full bg-secondary/50 rounded-xl p-1 h-auto flex overflow-x-auto scrollbar-hide gap-0.5 justify-start">
          <TabsTrigger value="posts" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
            <LayoutGrid className="w-3.5 h-3.5" /><span className="hidden xs:inline">Posts</span>
          </TabsTrigger>
          {isMusic && <>
            <TabsTrigger value="discography" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              🎵 <span className="hidden xs:inline">Album</span>
            </TabsTrigger>
            <TabsTrigger value="tracks" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              ▶️ <span className="hidden xs:inline">Singles</span>
            </TabsTrigger>
            <TabsTrigger value="tour" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <Calendar className="w-3.5 h-3.5" /><span className="hidden xs:inline">Shows</span>
            </TabsTrigger>

            <TabsTrigger value="epk" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <FileText className="w-3.5 h-3.5" /><span className="hidden xs:inline">EPK</span>
            </TabsTrigger>
            <TabsTrigger value="booking" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <Mail className="w-3.5 h-3.5" /><span className="hidden xs:inline">Book</span>
            </TabsTrigger>

          </>}
          {isPodcaster && <>
            <TabsTrigger value="episodes" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              🎙️ <span className="hidden xs:inline">Episodes</span>
            </TabsTrigger>
            <TabsTrigger value="guests" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              🎤 <span className="hidden xs:inline">Guests</span>
            </TabsTrigger>
            <TabsTrigger value="listen_on" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              🎧 <span className="hidden xs:inline">Listen On</span>
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="podcast_dashboard" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
                <TrendingUp className="w-3.5 h-3.5" /><span className="hidden xs:inline">Dashboard</span>
              </TabsTrigger>
            )}
          </>}
          {isPerformance && <>
            <TabsTrigger value="repertoire" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              🎭 <span className="hidden xs:inline">Repertoire</span>
            </TabsTrigger>
            <TabsTrigger value="showreel" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              🎬 <span className="hidden xs:inline">Reel</span>
            </TabsTrigger>
            <TabsTrigger value="performances" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <Calendar className="w-3.5 h-3.5" /><span className="hidden xs:inline">Shows</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <Star className="w-3.5 h-3.5" /><span className="hidden xs:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="booking" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <FileText className="w-3.5 h-3.5" /><span className="hidden xs:inline">Book</span>
            </TabsTrigger>
          </>}
          {!isMusic && !isPodcaster && !isPerformance && <>
            {!isFashion && <TabsTrigger value="journal" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <Flame className="w-3.5 h-3.5" /><span className="hidden xs:inline">Studio</span>
            </TabsTrigger>}
            <TabsTrigger value="series" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <Layers className="w-3.5 h-3.5" /><span className="hidden xs:inline">{isFashion ? 'Fashion Line' : 'Series'}</span>
            </TabsTrigger>
            {!isFashion && <TabsTrigger value="gallery" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
              <LayoutGrid className="w-3.5 h-3.5" /><span className="hidden xs:inline">Gallery</span>
            </TabsTrigger>}
            {!isPodcaster && isFashion && <>
              <TabsTrigger value="lookbook" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
                📸 <span className="hidden xs:inline">Lookbook</span>
              </TabsTrigger>
              <TabsTrigger value="drops" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
                <Zap className="w-3.5 h-3.5" /><span className="hidden xs:inline">Drops</span>
              </TabsTrigger>
              <TabsTrigger value="collabs" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
                <Users className="w-3.5 h-3.5" /><span className="hidden xs:inline">Collabs</span>
              </TabsTrigger>
            </>}
          </>}
          <TabsTrigger value="events" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Events</span>
            {upcomingCount > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold">{upcomingCount}</span>}
          </TabsTrigger>
          {!isPodcaster && <TabsTrigger value="discussion" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
            <MessageCircle className="w-3.5 h-3.5" /><span className="hidden xs:inline">Talk</span>
          </TabsTrigger>}
          {!isMusic && <TabsTrigger value="contact" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
            <Mail className="w-3.5 h-3.5" /><span className="hidden xs:inline">Contact</span>
          </TabsTrigger>}
          <TabsTrigger value="cv" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
            <FileText className="w-3.5 h-3.5" /><span className="hidden xs:inline">CV/Bio</span>
          </TabsTrigger>
          <TabsTrigger value="invite" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3">
            <Users className="w-3.5 h-3.5" /><span className="hidden xs:inline">Invite</span>
          </TabsTrigger>
        </TabsList>

        {/* Posts */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          {isOwner && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />New Post
            </button>
          )}
          {posts.length === 0
            ? <p className="text-center py-10 text-sm text-muted-foreground">No posts yet.</p>
            : (
              <div className="grid grid-cols-2 gap-3">
                {posts.map(p => <PostCard key={p.id} post={p} currentUserId={user?.id} />)}
              </div>
            )
          }
        </TabsContent>

        {/* Music tabs */}
        {isMusic && <>
          <TabsContent value="discography" className="mt-4">
            <DiscographyTab artist={artist} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="tracks" className="mt-4">
            <TracksTab artist={artist} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="tour" className="mt-4">
            <TourDatesTab artist={artist} isOwner={isOwner} />
          </TabsContent>

          <TabsContent value="epk" className="mt-4">
            <EPKTab artist={artist} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="booking" className="mt-4">
            <BookingTab artist={artist} isOwner={isOwner} />
          </TabsContent>

        </>}

        {/* Studio Journal */}
        <TabsContent value="journal" className="mt-4">
          <ArtistStudioJournal artistId={artistId} isOwner={isOwner} ownerId={artist.owner_id} />
        </TabsContent>

        {/* Series / Works */}
        <TabsContent value="series" className="mt-4">
          <ArtistSeriesTab artistId={artistId} isOwner={isOwner} ownerId={artist.owner_id} />
        </TabsContent>

        {/* Gallery */}
        <TabsContent value="gallery" className="mt-4">
          <ArtistGallery portfolioUrls={artist.portfolio_urls} posts={mediaPosts} isOwner={isOwner} artist={artist} />
        </TabsContent>

        {/* Podcaster tabs */}
        {isPodcaster && <>
          <TabsContent value="episodes" className="mt-4">
            <PodcastEpisodesTab artist={artist} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="guests" className="mt-4">
            <PodcastGuestsTab artist={artist} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="listen_on" className="mt-4">
            <PodcastListenOnTab artist={artist} isOwner={isOwner} />
          </TabsContent>
          {isOwner && (
            <TabsContent value="podcast_dashboard" className="mt-4">
              <PodcastDashboardTab artist={artist} posts={posts} followersCount={artist.followers_count} />
            </TabsContent>
          )}
        </>}

        {/* Performance-specific tabs */}
        {isPerformance && <>
          <TabsContent value="repertoire" className="mt-4">
            <RepertoireTab artistId={artistId} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="showreel" className="mt-4">
            <ShowreelTab artistId={artistId} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="performances" className="mt-4">
            <PerformancesTab artistId={artistId} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            <ReviewsTab artistId={artistId} isOwner={isOwner} />
          </TabsContent>
          <TabsContent value="booking" className="mt-4">
            <PerformanceBookingTab artist={artist} isOwner={isOwner} />
          </TabsContent>
        </>}

        {/* Fashion-only tabs */}
        {isFashion && <>
          <TabsContent value="lookbook" className="mt-4">
            <LookbookTab artistId={artistId} isOwner={isOwner} ownerId={artist.owner_id} />
          </TabsContent>
          <TabsContent value="drops" className="mt-4">
            <DropsTab artistId={artistId} isOwner={isOwner} ownerId={artist.owner_id} />
          </TabsContent>
          <TabsContent value="collabs" className="mt-4">
            <CollabCallsTab artistId={artistId} isOwner={isOwner} ownerId={artist.owner_id} />
          </TabsContent>
        </>}

        {/* Events */}
        <TabsContent value="events" className="mt-4">
          <PageEventsTab
            events={events}
            isOwner={isOwner}
            user={user}
            pageName={artist.name}
            pageImageUrl={artist.image_url}
            neighborhoodId={artist.neighborhood_id}
            neighborhoodName={artist.neighborhood_name}
            onCreated={() => queryClient.invalidateQueries({ queryKey: ['artist-events', artist.owner_id] })}
          />
        </TabsContent>

        {/* Community Discussion */}
        <TabsContent value="discussion" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-xl">
              <MessageCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Community Discussion</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ask questions, share thoughts, or start a conversation with {artist.name} and their followers.</p>
              </div>
            </div>
            <CommentSection targetType="artist" targetId={artistId} />
          </div>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-1">{isPodcaster ? 'Book Me As A Guest' : 'Book or Collaborate'}</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {isPodcaster
                ? `I would love to be a guest on your podcast`
                : `Reach out to ${artist.name} for commissions, collaborations, bookings, or any project inquiry.`}
            </p>
            <ArtistContactForm artist={artist} />
          </div>
        </TabsContent>

        {/* CV / Bio */}
        <TabsContent value="cv" className="mt-4">
          <ArtistCVTab artistId={artistId} isOwner={isOwner} ownerId={artist.owner_id} artistName={artist.name} />
        </TabsContent>

        {/* Invite Friends */}
        <TabsContent value="invite" className="mt-4">
          <button onClick={() => setShowInvite(true)} className="w-full px-4 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors">
            Invite Friends
          </button>
        </TabsContent>
      </Tabs>

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={window.location.href} title={artist.name} description={artist.bio} />

      {showEditProfile && <ArtistEditProfileModal artist={artist} onClose={() => setShowEditProfile(false)} />}
      {showMessage && <ArtistMessageModal artist={artist} onClose={() => setShowMessage(false)} />}
      {showInvite && <InviteFriendsModal onClose={() => setShowInvite(false)} />}
      {showCreatePost && <ArtistCreatePostModal artist={artist} user={user} onClose={() => setShowCreatePost(false)} />}
    </div>
  );
}