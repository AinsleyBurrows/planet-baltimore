import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Globe, MapPin, CheckCircle, Share2, Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import AppImage from '@/components/shared/AppImage';
import PostCard from '@/components/shared/PostCard';
import EventCard from '@/components/shared/EventCard';

const categoryLabels = {
  visual_art: 'Visual Art', music: 'Music', video: 'Video', photography: 'Photography',
  performance: 'Performance', literary: 'Literary', mixed_media: 'Mixed Media', digital: 'Digital', other: 'Other'
};

export default function ArtistDetail() {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
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
    queryFn: () => base44.entities.Post.filter({ author_name: artist.name }, '-created_date', 10),
    enabled: !!artist?.name,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['artist-events', artist?.neighborhood_name],
    queryFn: () => base44.entities.Event.filter({ neighborhood_name: artist.neighborhood_name }, '-date', 6),
    enabled: !!artist?.neighborhood_name,
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <div className="px-4 flex gap-4 items-end">
        <Skeleton className="w-20 h-20 rounded-full -mt-10" />
        <Skeleton className="h-8 w-40" />
      </div>
    </div>
  );

  if (!artist) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Artist not found</p>
      <Button variant="ghost" onClick={() => navigate('/artists')} className="mt-4">Back</Button>
    </div>
  );

  return (
    <div>
      <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary mb-2 block">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-primary/10">
        {artist.banner_url && <AppImage src={artist.banner_url} className="w-full h-full" clickable={false} />}
      </div>

      {/* Profile */}
      <div className="px-1 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <Avatar className="w-20 h-20 rounded-full border-4 border-background shadow-lg">
            <AvatarImage src={artist.image_url} className="object-cover" />
            <AvatarFallback className="bg-accent/10 text-accent text-2xl font-bold">{artist.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2 mb-1">
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9"><Share2 className="w-4 h-4" /></Button>
            <Button
              onClick={() => setFollowing(!following)}
              className={`rounded-lg h-9 px-4 gap-2 ${following ? 'bg-secondary text-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
            >
              {following ? <><Heart className="w-4 h-4 fill-current" />Following</> : <><Heart className="w-4 h-4" />Follow</>}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">{artist.name}</h1>
          {artist.is_verified && <CheckCircle className="w-5 h-5 text-accent fill-accent/20" />}
        </div>

        {artist.category && (
          <Badge variant="secondary" className="mb-2">{categoryLabels[artist.category] || artist.category}</Badge>
        )}

        {artist.bio && <p className="text-sm text-muted-foreground leading-relaxed mt-2">{artist.bio}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{(artist.followers_count || 0).toLocaleString()} followers</span>
          {artist.neighborhood_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{artist.neighborhood_name}</span>}
          {artist.website && <a href={artist.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline"><Globe className="w-4 h-4" />Website</a>}
        </div>

        {artist.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {artist.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={artist.portfolio_urls?.length > 0 ? 'portfolio' : 'posts'}>
        <TabsList className="w-full bg-secondary/50 rounded-xl">
          {artist.portfolio_urls?.length > 0 && <TabsTrigger value="portfolio" className="flex-1 rounded-lg">Portfolio</TabsTrigger>}
          <TabsTrigger value="posts" className="flex-1 rounded-lg">Posts</TabsTrigger>
          <TabsTrigger value="events" className="flex-1 rounded-lg">Events</TabsTrigger>
        </TabsList>

        {artist.portfolio_urls?.length > 0 && (
          <TabsContent value="portfolio" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {artist.portfolio_urls.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden">
                  <AppImage src={url} className="w-full h-full" aspectRatio="square" />
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No posts yet.</div>
          ) : posts.map(post => <PostCard key={post.id} post={post} />)}
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No upcoming events in this area.</div>
          ) : events.map(event => <EventCard key={event.id} event={event} compact />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}