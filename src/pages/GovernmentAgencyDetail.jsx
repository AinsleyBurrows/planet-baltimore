import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Globe, MapPin, Phone, Mail, Clock, CheckCircle, Share2, Users, Pencil, Camera, FileText, Calendar, Megaphone, Briefcase, FolderOpen, Crown, BarChart3, MessageCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import FollowButton from '@/components/shared/FollowButton';
import CommentSection from '@/components/shared/CommentSection';
import PageEventsTab from '@/components/shared/PageEventsTab';
import ShareModal from '@/components/shared/ShareModal';
import PageAdminBar from '@/components/shared/PageAdminBar';
import FoundingMemberBadge from '@/components/shared/FoundingMemberBadge.jsx';
import GovNewsTab from '@/components/government/GovNewsTab';
import GovServicesTab from '@/components/government/GovServicesTab';
import GovDocumentsTab from '@/components/government/GovDocumentsTab';
import GovLeadershipTab from '@/components/government/GovLeadershipTab';
import GovPublicInputTab from '@/components/government/GovPublicInputTab';
import GovContactTab from '@/components/government/GovContactTab';
import GovAboutTab from '@/components/government/GovAboutTab';

const AGENCY_TYPE_LABELS = {
  mayor_office: "Mayor's Office", city_council: 'City Council', department: 'Department',
  commission: 'Commission', agency: 'Agency', office: 'Office', court: 'Court', other: 'Government Entity',
};

export default function GovernmentAgencyDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const agencyId = window.location.pathname.split('/government-agencies/')[1];
  const [user, setUser] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: agency, isLoading } = useQuery({
    queryKey: ['government-agency', agencyId],
    queryFn: () => base44.entities.GovernmentAgency.get(agencyId),
    enabled: !!agencyId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['gov-events', agency?.owner_id],
    queryFn: () => base44.entities.Event.filter({ organizer_id: agency.owner_id }, '-date', 20),
    enabled: !!agency?.owner_id,
  });

  const uploadImage = async (file, field) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.GovernmentAgency.update(agencyId, { [field]: file_url });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agencyId] });
  };

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <div className="px-4 flex gap-4 items-end -mt-10">
        <Skeleton className="w-20 h-20 rounded-xl" />
        <div className="space-y-2 pb-1"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div>
      </div>
    </div>
  );

  if (!agency) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Agency not found</p>
      <Button variant="ghost" onClick={() => navigate('/government-agencies')} className="mt-4">Back</Button>
    </div>
  );

  const isOwner = user?.id === agency.owner_id;
  const isPlatformAdmin = user?.role === 'admin';
  const upcomingCount = events.filter(e => e.date && new Date(e.date) > new Date()).length;

  const handleDelete = async () => {
    await base44.entities.GovernmentAgency.delete(agencyId);
    navigate('/government-agencies');
  };
  const handleMute = async (reason) => {
    await base44.entities.GovernmentAgency.update(agencyId, { is_muted: true, mute_reason: reason });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agencyId] });
  };
  const handleUnmute = async () => {
    await base44.entities.GovernmentAgency.update(agencyId, { is_muted: false, mute_reason: '' });
    queryClient.invalidateQueries({ queryKey: ['government-agency', agencyId] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-secondary transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        {isOwner && <Badge className="bg-accent/10 text-accent border-0 text-xs">Your Agency Page</Badge>}
      </div>

      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-secondary">
        {agency.banner_url && <img src={agency.banner_url} alt="Banner" className="w-full h-full object-cover" />}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-black/50 text-white border-0 backdrop-blur-sm text-xs">{AGENCY_TYPE_LABELS[agency.agency_type] || agency.agency_type}</Badge>
          {agency.is_verified && <Badge className="bg-green-600/90 text-white border-0 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Official</Badge>}
        </div>
        {isOwner && (
          <button onClick={() => bannerInputRef.current?.click()} className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors">
            <Camera className="w-3.5 h-3.5" /> {agency.banner_url ? 'Edit banner' : 'Add banner'}
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'banner_url')} />
      </div>

      {/* Profile header */}
      <div className="px-1 pb-4" style={{ marginTop: '2rem' }}>
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <Avatar className="w-20 h-20 rounded-xl border-4 border-background shadow-lg cursor-pointer" onClick={isOwner ? () => avatarInputRef.current?.click() : undefined}>
              <AvatarImage src={agency.image_url} className="object-cover rounded-xl" />
              <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-2xl font-bold">{agency.name?.charAt(0)}</AvatarFallback>
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
              <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-9" onClick={() => setShowEdit(true)}>
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </Button>
            )}
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9" onClick={() => setShowShare(true)}><Share2 className="w-4 h-4" /></Button>
            {!isOwner && agency && <FollowButton targetType="government" targetId={agency.id} targetName={agency.name} />}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-xl font-bold text-foreground">{agency.name}</h1>
          {agency.is_verified && <CheckCircle className="w-5 h-5 text-accent fill-accent/20" />}
          {agency.is_founding_member && <FoundingMemberBadge />}
          {isPlatformAdmin && (
            <button
              onClick={async () => { await base44.entities.GovernmentAgency.update(agencyId, { is_founding_member: !agency.is_founding_member }); queryClient.invalidateQueries({ queryKey: ['government-agency', agencyId] }); }}
              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${agency.is_founding_member ? 'border-yellow-400 text-yellow-600 hover:bg-yellow-50' : 'border-muted text-muted-foreground hover:border-yellow-400 hover:text-yellow-600'}`}
            >
              {agency.is_founding_member ? '★ Remove Founding' : '☆ Grant Founding'}
            </button>
          )}
        </div>

        {agency.tagline && <p className="text-sm text-accent font-medium mt-0.5">{agency.tagline}</p>}
        {agency.description && <p className="text-sm text-muted-foreground leading-relaxed mt-2 line-clamp-3">{agency.description}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-foreground" /> {(agency.followers_count || 0).toLocaleString()} followers</span>
          {agency.neighborhood_name && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-foreground" /> {agency.neighborhood_name}</span>}
          {agency.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-foreground" /> {agency.phone}</span>}
          {agency.website && <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline"><Globe className="w-3.5 h-3.5" /> Website</a>}
        </div>

        {agency.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {agency.tags.map((t, i) => <Badge key={i} variant="secondary" className="text-xs">#{t}</Badge>)}
          </div>
        )}

        <PageAdminBar isOwner={isOwner} isPlatformAdmin={isPlatformAdmin} isMuted={agency.is_muted} muteReason={agency.mute_reason} onDelete={handleDelete} onMute={handleMute} onUnmute={handleUnmute} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="news">
        <TabsList className="w-full bg-secondary/50 rounded-xl p-1 h-auto flex overflow-x-auto scrollbar-hide gap-0.5 justify-start">
          <TabsTrigger value="news" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><Megaphone className="w-3.5 h-3.5" /><span className="hidden xs:inline">News</span></TabsTrigger>
          <TabsTrigger value="events" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><Calendar className="w-3.5 h-3.5" /><span className="hidden xs:inline">Events</span>{upcomingCount > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[9px] font-bold">{upcomingCount}</span>}</TabsTrigger>
          <TabsTrigger value="services" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><Briefcase className="w-3.5 h-3.5" /><span className="hidden xs:inline">Services</span></TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><FolderOpen className="w-3.5 h-3.5" /><span className="hidden xs:inline">Documents</span></TabsTrigger>
          <TabsTrigger value="leadership" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><Crown className="w-3.5 h-3.5" /><span className="hidden xs:inline">Leadership</span></TabsTrigger>
          <TabsTrigger value="input" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><BarChart3 className="w-3.5 h-3.5" /><span className="hidden xs:inline">Public Input</span></TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><Mail className="w-3.5 h-3.5" /><span className="hidden xs:inline">Contact</span></TabsTrigger>
          <TabsTrigger value="about" className="rounded-lg flex items-center gap-1 py-2 text-xs sm:text-sm flex-shrink-0 px-3"><Info className="w-3.5 h-3.5" /><span className="hidden xs:inline">About</span></TabsTrigger>
        </TabsList>

        <TabsContent value="news" className="mt-4"><GovNewsTab agency={agency} isOwner={isOwner} user={user} /></TabsContent>
        <TabsContent value="events" className="mt-4">
          <PageEventsTab events={events} isOwner={isOwner} user={user} pageName={agency.name} pageImageUrl={agency.image_url} neighborhoodId={agency.neighborhood_id} neighborhoodName={agency.neighborhood_name} onCreated={() => queryClient.invalidateQueries({ queryKey: ['gov-events', agency.owner_id] })} />
        </TabsContent>
        <TabsContent value="services" className="mt-4"><GovServicesTab agency={agency} isOwner={isOwner} /></TabsContent>
        <TabsContent value="documents" className="mt-4"><GovDocumentsTab agency={agency} isOwner={isOwner} /></TabsContent>
        <TabsContent value="leadership" className="mt-4"><GovLeadershipTab agency={agency} isOwner={isOwner} /></TabsContent>
        <TabsContent value="input" className="mt-4"><GovPublicInputTab agency={agency} isOwner={isOwner} /></TabsContent>
        <TabsContent value="contact" className="mt-4"><GovContactTab agency={agency} isOwner={isOwner} user={user} /></TabsContent>
        <TabsContent value="about" className="mt-4"><GovAboutTab agency={agency} /></TabsContent>
      </Tabs>

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} url={window.location.href} title={agency.name} description={agency.description} />
    </div>
  );
}