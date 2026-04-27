import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Globe, MapPin, Phone, Clock, CheckCircle, Share2, Users, Navigation, Utensils, Pencil, Camera, MessageSquare, ShoppingCart, Briefcase, Music, HeartPulse, Palette, HandHeart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import AppImage from '@/components/shared/AppImage';
import PostCard from '@/components/shared/PostCard';
import FollowButton from '@/components/shared/FollowButton';
import CommentSection from '@/components/shared/CommentSection';
import RestaurantHub from '@/components/business/RestaurantHub';
import RetailHub from '@/components/business/RetailHub';
import ServiceHub from '@/components/business/ServiceHub';
import EntertainmentHub from '@/components/business/EntertainmentHub';
import HealthHub from '@/components/business/HealthHub';
import CreativeHub from '@/components/business/CreativeHub';
import NonprofitHub from '@/components/business/NonprofitHub';
import BusinessEditProfileModal from '@/components/business/BusinessEditProfileModal';
import BusinessMessageModal from '@/components/business/BusinessMessageModal';
import BusinessCreatePostModal from '@/components/business/BusinessCreatePostModal';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';
import ShareModal from '@/components/shared/ShareModal';

const categoryLabels = {
  restaurant: 'Restaurant', retail: 'Retail', service: 'Service', entertainment: 'Entertainment',
  health: 'Health', education: 'Education', technology: 'Technology', creative: 'Creative', nonprofit: 'Nonprofit', other: 'Other'
};

export default function BusinessDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const businessId = window.location.pathname.split('/businesses/')[1];
  const [user, setUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const uploadImage = async (file, field) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.BusinessPage.update(businessId, { [field]: file_url });
    queryClient.invalidateQueries({ queryKey: ['business', businessId] });
  };

  const { data: business, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const results = await base44.entities.BusinessPage.filter({ id: businessId });
      return results[0];
    },
    enabled: !!businessId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['business-posts', businessId],
    queryFn: () => base44.entities.Post.filter({ page_id: businessId, page_type: 'business' }, '-created_date', 20),
    enabled: !!businessId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['business-events', business?.owner_id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: business.owner_id }, '-date', 10),
    enabled: !!business?.owner_id,
  });

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <div className="px-4 flex gap-4 items-end">
        <Skeleton className="w-20 h-20 rounded-xl -mt-10" />
        <Skeleton className="h-8 w-40" />
      </div>
    </div>
  );

  if (!business) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Business not found</p>
      <Button variant="ghost" onClick={() => navigate('/businesses')} className="mt-4">Back</Button>
    </div>
  );

  const isOwner = user?.id === business.owner_id;
  const category = business.category;
  const isRestaurant = category === 'restaurant';
  const isRetail = category === 'retail';
  const isService = category === 'service';
  const isEntertainment = category === 'entertainment';
  const isHealth = category === 'health';
  const isCreative = category === 'creative';
  const isNonprofit = category === 'nonprofit';
  const hasCategoryHub = isRestaurant || isRetail || isService || isEntertainment || isHealth || isCreative || isNonprofit;
  const mapsUrl = business.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}` : '';

  return (
    <div>
      <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary mb-2 block">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
        {business.banner_url && <AppImage src={business.banner_url} className="w-full h-full" clickable={false} />}
        {isOwner && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            {business.banner_url ? 'Edit banner' : 'Add banner'}
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'banner_url')} />
      </div>

      {/* Profile */}
      <div className="px-1 pb-4">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <Avatar
              className="w-20 h-20 rounded-xl border-4 border-background shadow-lg"
              onClick={isOwner ? () => avatarInputRef.current?.click() : undefined}
              style={isOwner ? { cursor: 'pointer' } : {}}
            >
              <AvatarImage src={business.image_url} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl font-bold">{business.name?.charAt(0)}</AvatarFallback>
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
                  <Pencil className="w-3.5 h-3.5" /> Edit Page
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowMessage(true)}>
                  <MessageSquare className="w-3.5 h-3.5" /> Message All
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => setShowShare(true)}><Share2 className="w-4 h-4" /></Button>
            {!isOwner && business && <FollowButton targetType="business" targetId={business.id} targetName={business.name} />}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-foreground">{business.name}</h1>
          {business.is_verified && <CheckCircle className="w-5 h-5 text-accent fill-accent/20" />}
        </div>

        {business.category && (
          <Badge variant="secondary" className="mb-2">{categoryLabels[business.category] || business.category}</Badge>
        )}

        {business.description && <p className="text-sm text-muted-foreground leading-relaxed mt-2">{business.description}</p>}

        {/* Contact Info */}
        <div className="mt-4 space-y-2">
          {business.address && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{business.address}</span>
              {mapsUrl && <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent text-xs hover:underline ml-auto"><Navigation className="w-3 h-3" />Directions</a>}
            </div>
          )}
          {business.phone && (
            <a href={`tel:${business.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
              <Phone className="w-4 h-4" />{business.phone}
            </a>
          )}
          {business.hours && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{business.hours}</span>
            </div>
          )}
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-accent hover:underline">
              <Globe className="w-4 h-4" />{business.website}
            </a>
          )}
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-4 h-4" />{(business.followers_count || 0).toLocaleString()} followers</span>
          {business.neighborhood_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{business.neighborhood_name}</span>}
        </div>

        {business.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {business.tags.map((tag, i) => <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={hasCategoryHub ? 'hub' : 'posts'}>
        <TabsList className={`w-full bg-secondary/50 rounded-xl grid ${hasCategoryHub ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {hasCategoryHub && (
            <TabsTrigger value="hub" className="rounded-lg flex items-center gap-1.5 text-xs sm:text-sm">
              {isRestaurant && <><Utensils className="w-3.5 h-3.5" /> Menu</>}
              {isRetail && <><ShoppingCart className="w-3.5 h-3.5" /> Shop</>}
              {isService && <><Briefcase className="w-3.5 h-3.5" /> Services</>}
              {isEntertainment && <>Posts</>}
              {isHealth && <><HeartPulse className="w-3.5 h-3.5" /> Health</>}
              {isCreative && <><Palette className="w-3.5 h-3.5" /> Portfolio</>}
              {isNonprofit && <><HandHeart className="w-3.5 h-3.5" /> Mission</>}
            </TabsTrigger>
          )}
          <TabsTrigger value="posts" className="rounded-lg">Updates</TabsTrigger>
          <TabsTrigger value="about" className="rounded-lg">About</TabsTrigger>
          <TabsTrigger value="invite" className="rounded-lg">Invite</TabsTrigger>
          <TabsTrigger value="comments" className="rounded-lg">Comments</TabsTrigger>
          </TabsList>

        {hasCategoryHub && (
          <TabsContent value="hub" className="mt-4">
            {isRestaurant && <RestaurantHub business={business} isOwner={isOwner} user={user} events={events} />}
            {isRetail && <RetailHub business={business} isOwner={isOwner} user={user} events={events} />}
            {isService && <ServiceHub business={business} isOwner={isOwner} user={user} events={events} />}
            {isEntertainment && <EntertainmentHub business={business} isOwner={isOwner} user={user} events={events} />}
            {isHealth && <HealthHub business={business} isOwner={isOwner} user={user} events={events} />}
            {isCreative && <CreativeHub business={business} isOwner={isOwner} user={user} events={events} />}
            {isNonprofit && <NonprofitHub business={business} isOwner={isOwner} user={user} events={events} />}
          </TabsContent>
        )}

        <TabsContent value="posts" className="mt-4 space-y-4">
          {isOwner && (
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-border hover:border-accent text-muted-foreground hover:text-accent text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />Post Update
            </button>
          )}
          {posts.length === 0
            ? <div className="text-center py-12 text-muted-foreground text-sm">No updates yet.</div>
            : posts.map(post => <PostCard key={post.id} post={post} currentUserId={user?.id} />)
          }
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <CommentSection targetType="business" targetId={businessId} />
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <div className="bg-card rounded-xl border border-border p-5 space-y-4 text-sm">
            {business.description && <div><h3 className="font-semibold text-foreground mb-1">About</h3><p className="text-muted-foreground">{business.description}</p></div>}
            {business.neighborhood_name && <div><h3 className="font-semibold text-foreground mb-1">Neighborhood</h3><p className="text-muted-foreground">{business.neighborhood_name}</p></div>}
            {business.hours && <div><h3 className="font-semibold text-foreground mb-1">Hours</h3><p className="text-muted-foreground">{business.hours}</p></div>}
          </div>
        </TabsContent>

        <TabsContent value="invite" className="mt-4">
          <button onClick={() => setShowInvite(true)} className="w-full px-4 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors">
            Invite Friends
          </button>
        </TabsContent>
      </Tabs>

      {showEdit && <BusinessEditProfileModal business={business} onClose={() => setShowEdit(false)} />}
      {showMessage && <BusinessMessageModal business={business} onClose={() => setShowMessage(false)} />}
      {showInvite && <InviteFriendsModal onClose={() => setShowInvite(false)} />}
      {showCreatePost && user && <BusinessCreatePostModal business={business} user={user} onClose={() => setShowCreatePost(false)} />}
      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={`${window.location.origin}/businesses/${businessId}`} title={business.name} description={business.description} />
    </div>
  );
}