import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MapPin, Globe, Phone, Mail, Clock, Shield, Users, Calendar, Pencil, Heart, Share2, ExternalLink } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/shared/PostCard';
import EventCard from '@/components/shared/EventCard';
import FollowButton from '@/components/shared/FollowButton';
import CommentSection from '@/components/shared/CommentSection';

const ORG_TYPE_LABELS = {
  museum: 'Museum', gallery: 'Gallery', studio_space: 'Artist Studio Space',
  collective: 'Artist Collective', residency: 'Residency Program', nonprofit: 'Arts Nonprofit',
  cultural_institution: 'Cultural Institution', performance_space: 'Performance Space',
  community_art_space: 'Community Art Space', diy_space: 'DIY / Alt Space',
  art_school: 'Art School', other: 'Other',
};

export default function ArtsOrgDetail() {
  const id = window.location.pathname.split('/').pop();


  const { data: org, isLoading } = useQuery({
    queryKey: ['arts-org', id],
    queryFn: () => base44.entities.ArtsOrganization.get(id),
  });

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
      </div>

      {/* Profile row */}
      <div className="relative px-1 -mt-10">
        <div className="flex items-end justify-between">
          <Avatar className="w-20 h-20 border-4 border-background rounded-xl">
            <AvatarImage src={org.image_url} />
            <AvatarFallback className="rounded-xl text-2xl font-bold bg-accent/10 text-accent">{org.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2 mb-1">
            {org && <FollowButton targetType="arts_org" targetId={org.id} targetName={org.name} />}
            <Button size="sm" variant="outline" className="rounded-lg transition-all duration-150 active:scale-95" aria-label="Share"><Share2 className="w-4 h-4" /></Button>
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
            {org.neighborhood_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{org.neighborhood_name}</span>}
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
            <TabsTrigger value="about" className="flex-1 rounded-lg">About</TabsTrigger>
            <TabsTrigger value="comments" className="flex-1 rounded-lg">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {posts.length === 0
              ? <p className="text-center py-10 text-sm text-muted-foreground">No posts yet.</p>
              : posts.map(p => <PostCard key={p.id} post={p} />)}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {events.length === 0
              ? <p className="text-center py-10 text-sm text-muted-foreground">No upcoming events.</p>
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{events.map(e => <EventCard key={e.id} event={e} />)}</div>}
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <CommentSection targetType="arts_org" targetId={id} />
          </TabsContent>

          <TabsContent value="about" className="mt-4 space-y-4">
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
    </div>
  );
}