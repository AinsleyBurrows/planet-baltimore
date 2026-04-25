import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Globe, MapPin, CheckCircle, Share2, Users, LayoutGrid, CalendarDays, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import PostCard from '@/components/shared/PostCard';
import FollowButton from '@/components/shared/FollowButton';
import ArtistGallery from '@/components/artist/ArtistGallery';
import CommentSection from '@/components/shared/CommentSection';
import ArtistSchedule from '@/components/artist/ArtistSchedule';
import ArtistContactForm from '@/components/artist/ArtistContactForm';

const categoryLabels = {
  visual_art: 'Visual Art', music: 'Music', video: 'Video', photography: 'Photography',
  performance: 'Performance', literary: 'Literary', mixed_media: 'Mixed Media', digital: 'Digital', other: 'Other'
};

const socialIcons = {
  instagram: '📸', twitter: '🐦', tiktok: '🎵', youtube: '▶️', soundcloud: '☁️', bandcamp: '🎸', linkedin: '💼'
};

export default function ArtistDetail() {
  const navigate = useNavigate();
  const artistId = window.location.pathname.split('/artists/')[1];

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      const results = await base44.entities.ArtistPage.filter({ id: artistId });
      return results[0];
    },
    enabled: !!artistId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['artist-posts', artist?.name],
    queryFn: () => base44.entities.Post.filter({ author_name: artist.name }, '-created_date', 20),
    enabled: !!artist?.name,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['artist-events', artistId],
    queryFn: () => base44.entities.Event.filter({ organizer_id: artist.owner_id }, 'date', 12),
    enabled: !!artist?.owner_id,
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-52 rounded-xl" />
      <div className="px-4 flex gap-4 items-end -mt-12">
        <Skeleton className="w-20 h-20 rounded-full" />
        <div className="space-y-2 pb-1"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-24" /></div>
      </div>
      <div className="space-y-3 px-1">
        <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );

  if (!artist) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Artist not found</p>
      <Button variant="ghost" onClick={() => navigate('/artists')} className="mt-4">Back to Artists</Button>
    </div>
  );

  const mediaPosts = posts.filter(p => p.media_urls?.length > 0);

  return (
    <div>
      <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary mb-2 block">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Banner */}
      <div className="relative h-52 rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 via-primary/10 to-secondary">
        {artist.banner_url && (
          <img src={artist.banner_url} alt="Banner" className="w-full h-full object-cover" />
        )}
        {/* Category badge overlay */}
        {artist.category && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm text-xs capitalize">
              {categoryLabels[artist.category] || artist.category}
            </Badge>
          </div>
        )}
      </div>

      {/* Profile header */}
      <div className="px-1 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <Avatar className="w-20 h-20 rounded-full border-4 border-background shadow-lg">
            <AvatarImage src={artist.image_url} className="object-cover" />
            <AvatarFallback className="bg-accent/10 text-accent text-2xl font-bold">{artist.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2 mb-1">
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9"><Share2 className="w-4 h-4" /></Button>
            {artist && <FollowButton targetType="artist" targetId={artist.id} targetName={artist.name} />}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">{artist.name}</h1>
          {artist.is_verified && <CheckCircle className="w-5 h-5 text-accent fill-accent/20" />}
        </div>

        {artist.bio && <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{artist.bio}</p>}

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
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors capitalize"
              >
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gallery">
        <TabsList className="w-full bg-secondary/50 rounded-xl p-1 h-auto">
          <TabsTrigger value="gallery" className="flex-1 rounded-lg flex items-center gap-1.5 py-2 text-xs sm:text-sm">
            <LayoutGrid className="w-3.5 h-3.5" />Gallery
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex-1 rounded-lg flex items-center gap-1.5 py-2 text-xs sm:text-sm">
            <CalendarDays className="w-3.5 h-3.5" />Schedule
            {events.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold leading-none">
                {events.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex-1 rounded-lg flex items-center gap-1.5 py-2 text-xs sm:text-sm">
            Posts
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex-1 rounded-lg flex items-center gap-1.5 py-2 text-xs sm:text-sm">
            <Mail className="w-3.5 h-3.5" />Contact
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1 rounded-lg flex items-center gap-1.5 py-2 text-xs sm:text-sm">
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="mt-4">
          <ArtistGallery portfolioUrls={artist.portfolio_urls} posts={mediaPosts} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <ArtistSchedule events={events} />
        </TabsContent>

        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No posts yet.</div>
          ) : posts.map(post => <PostCard key={post.id} post={post} />)}
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentSection targetType="artist" targetId={artistId} />
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-1">Book or Collaborate</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Reach out to {artist.name} for commissions, collaborations, bookings, or any project inquiry.
            </p>
            <ArtistContactForm artist={artist} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}