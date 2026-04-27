import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  ArrowLeft, Users, Globe, Mail, MapPin, CheckCircle, Share2, Bell,
  FileText, Crown, Shield, Edit3, Send, Eye, Plus, Trash2, ChevronDown,
  MessageSquare, Calendar, Info, ExternalLink, Download, AlertTriangle, Camera, Loader2
} from 'lucide-react';
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
import BoardMemberCard from '@/components/association/BoardMemberCard';
import BoardMemberForm from '@/components/association/BoardMemberForm';
import BylawsEditor from '@/components/association/BylawsEditor';
import MassMessageModal from '@/components/association/MassMessageModal';
import VotingTab from '@/components/association/VotingTab';
import DocumentsTab from '@/components/association/DocumentsTab';
import InviteFriendsModal from '@/components/profile/InviteFriendsModal';
import AssociationEditModal from '@/components/association/AssociationEditModal';
import FollowButton from '@/components/shared/FollowButton';
import { format } from 'date-fns';

export default function CommunityAssociationDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [showBylawsEditor, setShowBylawsEditor] = useState(false);
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editingBoardMember, setEditingBoardMember] = useState(null);
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const assocId = window.location.pathname.split('/community-associations/')[1];

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: association, isLoading } = useQuery({
    queryKey: ['community-association', assocId],
    queryFn: async () => {
      const r = await base44.entities.CommunityAssociation.filter({ id: assocId });
      return r[0];
    },
    enabled: !!assocId,
  });

  const { data: boardMembers = [] } = useQuery({
    queryKey: ['board-members', assocId],
    queryFn: () => base44.entities.BoardMember.filter({ association_id: assocId, is_active: true }, 'sort_order', 50),
    enabled: !!assocId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['assoc-members', assocId],
    queryFn: () => base44.entities.AssociationMember.filter({ association_id: assocId }, '-joined_at', 100),
    enabled: !!assocId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['assoc-posts', assocId],
    queryFn: () => base44.entities.Post.filter({ community_id: assocId }, '-created_date', 20),
    enabled: !!assocId,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['assoc-events', association?.neighborhood_name],
    queryFn: () => base44.entities.Event.filter({ neighborhood_name: association.neighborhood_name }, 'date', 12),
    enabled: !!association?.neighborhood_name,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (isMember) {
        const existing = members.find(m => m.user_id === currentUser?.id);
        if (existing) await base44.entities.AssociationMember.delete(existing.id);
      } else {
        await base44.entities.AssociationMember.create({
          association_id: assocId,
          user_id: currentUser.id,
          user_name: currentUser.full_name,
          user_email: currentUser.email,
          user_avatar: currentUser.avatar_url,
          joined_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      setIsMember(!isMember);
      queryClient.invalidateQueries({ queryKey: ['assoc-members', assocId] });
    },
  });

  useEffect(() => {
    if (currentUser && members.length > 0) {
      setIsMember(members.some(m => m.user_id === currentUser.id));
    }
  }, [currentUser, members]);

  const uploadImage = async (file, field) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.CommunityAssociation.update(association.id, { [field]: file_url });
    queryClient.invalidateQueries({ queryKey: ['community-association', assocId] });
    setUploading(false);
  };

  const isAdmin = currentUser && association && (
    association.owner_id === currentUser.id ||
    (association.admins || []).includes(currentUser.id)
  );

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-10 rounded-xl" />
    </div>
  );

  if (!association) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Association not found</p>
      <Button variant="ghost" onClick={() => navigate('/community-associations')} className="mt-4">Back</Button>
    </div>
  );

  const roleOrder = { president: 0, vice_president: 1, treasurer: 2, secretary: 3, board_member: 4, committee_chair: 5, other: 6 };
  const sortedBoard = [...boardMembers].sort((a, b) => (roleOrder[a.role] ?? 6) - (roleOrder[b.role] ?? 6));

  return (
    <div className="space-y-0">
      <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 rounded-full hover:bg-secondary active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mb-2 block">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-accent/10">
        {association.banner_url && <AppImage src={association.banner_url} className="w-full h-full" clickable={false} />}
        {isAdmin && (
          <button
            onClick={() => bannerInputRef.current?.click()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/55 hover:bg-black/75 text-white text-xs font-semibold backdrop-blur-sm transition-colors"
            disabled={uploading}
          >
            <Camera className="w-3.5 h-3.5" />
            {uploading ? 'Uploading...' : association.banner_url ? 'Edit banner' : 'Add banner'}
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'banner_url')} />
        {/* Official badge overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {association.is_official && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold backdrop-blur-sm shadow">
              <Shield className="w-3 h-3" />Official Association
            </span>
          )}
          {association.is_verified && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-600/90 text-white text-xs font-semibold">
              <CheckCircle className="w-3 h-3" />Verified
            </span>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="px-1 pb-4 mt-[10px]">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="relative">
            <Avatar className="w-20 h-20 rounded-xl border-4 border-background shadow-lg cursor-pointer hover:opacity-80 transition-opacity" onClick={isAdmin ? () => avatarInputRef.current?.click() : undefined}>
              <AvatarImage src={association.image_url} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-2xl font-bold">
                {association.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isAdmin && (
              <span className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-foreground border-2 border-background flex items-center justify-center shadow-sm cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                <Camera className="w-3 h-3 text-background" />
              </span>
            )}
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'image_url')} />
          </div>
          <div className="flex gap-2 mb-1 flex-wrap justify-end">
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg gap-1.5"
                  onClick={() => setShowEditProfile(true)}
                >
                  <Edit3 className="w-3.5 h-3.5" />Edit Profile
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg gap-1.5 border-primary/40 text-primary"
                  onClick={() => setShowMassMessage(true)}
                >
                  <Send className="w-3.5 h-3.5" />Message All
                </Button>
              </>
            )}
            <Button variant="outline" size="icon" className="rounded-lg h-9 w-9"><Share2 className="w-4 h-4" /></Button>
            <FollowButton targetType="community" targetId={assocId} targetName={association.name} />
            <Button
              onClick={() => currentUser && joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className={`rounded-lg h-9 px-4 gap-1.5 ${isMember ? 'bg-secondary text-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
            >
              {isMember ? <><Bell className="w-4 h-4" />Joined</> : <><Users className="w-4 h-4" />Join</>}
            </Button>
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground">{association.name}</h1>
        {association.tagline && <p className="text-sm text-accent font-medium mt-0.5">{association.tagline}</p>}

        {association.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">{association.description}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{members.length.toLocaleString()} members</span>
          {association.neighborhood_name && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{association.neighborhood_name}</span>}
          {association.website && <a href={association.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:underline"><Globe className="w-4 h-4" />Website</a>}
          {association.contact_email && <a href={`mailto:${association.contact_email}`} className="flex items-center gap-1.5 text-accent hover:underline"><Mail className="w-4 h-4" />{association.contact_email}</a>}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="mt-[10px]">
        <TabsList className="w-full bg-secondary/50 rounded-xl p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="posts" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Posts</TabsTrigger>
          <TabsTrigger value="events" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Events</TabsTrigger>
          <TabsTrigger value="voting" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Voting</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Documents</TabsTrigger>
          <TabsTrigger value="members" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Members</TabsTrigger>
          <TabsTrigger value="board" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Board</TabsTrigger>
          <TabsTrigger value="bylaws" className="flex-1 rounded-lg text-xs sm:text-sm py-2">By Laws</TabsTrigger>
          <TabsTrigger value="invite" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Invite</TabsTrigger>
          <TabsTrigger value="comments" className="flex-1 rounded-lg text-xs sm:text-sm py-2">Comments</TabsTrigger>
          <TabsTrigger value="about" className="flex-1 rounded-lg text-xs sm:text-sm py-2">About</TabsTrigger>
        </TabsList>

        {/* POSTS */}
        <TabsContent value="posts" className="mt-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No posts yet in this association.</div>
          ) : posts.map(post => <PostCard key={post.id} post={post} />)}
        </TabsContent>

        {/* EVENTS */}
        <TabsContent value="events" className="mt-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No upcoming events in this area.</div>
          ) : events.map(event => <EventCard key={event.id} event={event} compact />)}
        </TabsContent>

        {/* VOTING */}
        <TabsContent value="voting" className="mt-4">
          <VotingTab associationId={assocId} isAdmin={isAdmin} />
        </TabsContent>

        {/* DOCUMENTS */}
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab associationId={assocId} isAdmin={isAdmin} />
        </TabsContent>

        {/* MEMBERS */}
        <TabsContent value="members" className="mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">{members.length} members</p>
            </div>
            {members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">No members yet. Join to be the first!</div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.user_avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{member.user_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{member.user_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role || 'member'}</p>
                    </div>
                    {member.joined_at && (
                      <span className="text-xs text-muted-foreground">Joined {format(new Date(member.joined_at), 'MMM yyyy')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* BOARD */}
        <TabsContent value="board" className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Leadership &amp; Board</h2>
              {isAdmin && (
                <Button size="sm" onClick={() => { setEditingBoardMember(null); setShowBoardForm(true); }} className="bg-primary text-primary-foreground rounded-lg gap-1.5">
                  <Plus className="w-3.5 h-3.5" />Add Member
                </Button>
              )}
            </div>
            {sortedBoard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Crown className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No board members listed yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sortedBoard.map(member => (
                  <BoardMemberCard
                    key={member.id}
                    member={member}
                    isAdmin={isAdmin}
                    onEdit={() => { setEditingBoardMember(member); setShowBoardForm(true); }}
                    onDelete={() => {
                      base44.entities.BoardMember.update(member.id, { is_active: false }).then(() =>
                        queryClient.invalidateQueries({ queryKey: ['board-members', assocId] })
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* INVITE FRIENDS */}
        <TabsContent value="invite" className="mt-4">
          <button onClick={() => setShowInvite(true)} className="w-full px-4 py-3 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors">
            Invite Friends to Join
          </button>
        </TabsContent>

        {/* BY LAWS */}
        <TabsContent value="bylaws" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />By Laws &amp; Governing Documents
              </h2>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowBylawsEditor(true)} variant="outline" className="rounded-lg gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />Edit
                </Button>
              )}
            </div>

            {association.bylaws_updated_at && (
              <p className="text-xs text-muted-foreground">Last updated: {format(new Date(association.bylaws_updated_at), 'MMMM d, yyyy')}</p>
            )}

            {!association.bylaws_text && !association.bylaws_doc_url ? (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No bylaws posted yet.</p>
                {isAdmin && <p className="text-xs text-muted-foreground mt-1">Click Edit to add governing documents.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {association.bylaws_doc_url && (
                  <a
                    href={association.bylaws_doc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">Bylaws Document</p>
                      <p className="text-xs text-muted-foreground">Click to view PDF</p>
                    </div>
                    <Download className="w-4 h-4 text-primary" />
                  </a>
                )}
                {association.bylaws_text && (
                  <div className="bg-card border border-border rounded-xl p-5">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{association.bylaws_text}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* COMMENTS */}
        <TabsContent value="comments" className="mt-4">
          <CommentSection targetType="association" targetId={assocId} />
        </TabsContent>

        {/* ABOUT */}
        <TabsContent value="about" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Info className="w-4 h-4 text-primary" />About</h3>
              <p className="text-sm text-muted-foreground">{association.description || 'No description provided.'}</p>
            </div>
            {association.address && (
              <div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">Address</h3>
                <p className="text-sm text-muted-foreground">{association.address}</p>
              </div>
            )}
            {association.contact_email && (
              <div>
                <h3 className="font-semibold text-foreground mb-1 text-sm">Contact</h3>
                <a href={`mailto:${association.contact_email}`} className="text-sm text-accent hover:underline">{association.contact_email}</a>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground mb-1 text-sm">Founded By</h3>
              <p className="text-sm text-muted-foreground">{association.owner_name}</p>
            </div>
            {isAdmin && association.mass_message_log?.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">Recent Announcements</h3>
                <div className="space-y-2">
                  {association.mass_message_log.slice(-5).reverse().map((log, i) => (
                    <div key={i} className="p-3 bg-secondary/50 rounded-lg text-xs">
                      <p className="font-medium">{log.subject}</p>
                      <p className="text-muted-foreground mt-0.5">{log.sent_at ? format(new Date(log.sent_at), 'MMM d, yyyy h:mm a') : ''} · {log.delivered} delivered</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showBoardForm && (
        <BoardMemberForm
          associationId={assocId}
          member={editingBoardMember}
          onClose={() => { setShowBoardForm(false); setEditingBoardMember(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['board-members', assocId] });
            setShowBoardForm(false);
            setEditingBoardMember(null);
          }}
        />
      )}

      {showBylawsEditor && (
        <BylawsEditor
          association={association}
          onClose={() => setShowBylawsEditor(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['community-association', assocId] });
            setShowBylawsEditor(false);
          }}
        />
      )}

      {showMassMessage && (
        <MassMessageModal
          association={association}
          memberCount={members.length}
          onClose={() => setShowMassMessage(false)}
        />
      )}

      {showInvite && (
        <InviteFriendsModal onClose={() => setShowInvite(false)} />
      )}

      {showEditProfile && (
        <AssociationEditModal association={association} onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
}