import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Search, Star, Briefcase, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminVerification() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const queryClient = useQueryClient();

  // Fetch entities for verification
  const { data: users = [] } = useQuery({
    queryKey: ['admin-verify-users'],
    queryFn: () => base44.asServiceRole.entities.User.list('-created_date', 200),
  });

  const { data: businesses = [] } = useQuery({
    queryKey: ['admin-verify-businesses'],
    queryFn: () => base44.asServiceRole.entities.BusinessPage.list('-created_date', 200),
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ['admin-verify-orgs'],
    queryFn: () => base44.asServiceRole.entities.ArtsOrganization.list('-created_date', 200),
  });

  const verifyUserMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.asServiceRole.entities.User.update(userId, { is_verified: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verify-users'] });
    },
  });

  const unverifyUserMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.asServiceRole.entities.User.update(userId, { is_verified: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verify-users'] });
    },
  });

  const verifyBusinessMutation = useMutation({
    mutationFn: async (businessId) => {
      await base44.asServiceRole.entities.BusinessPage.update(businessId, { is_verified: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verify-businesses'] });
    },
  });

  const unverifyBusinessMutation = useMutation({
    mutationFn: async (businessId) => {
      await base44.asServiceRole.entities.BusinessPage.update(businessId, { is_verified: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verify-businesses'] });
    },
  });

  const verifyOrgMutation = useMutation({
    mutationFn: async (orgId) => {
      await base44.asServiceRole.entities.ArtsOrganization.update(orgId, { is_verified: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verify-orgs'] });
    },
  });

  const unverifyOrgMutation = useMutation({
    mutationFn: async (orgId) => {
      await base44.asServiceRole.entities.ArtsOrganization.update(orgId, { is_verified: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verify-orgs'] });
    },
  });

  // Filter functions
  const filterItems = (items, query) => {
    if (!query) return items;
    const lower = query.toLowerCase();
    return items.filter(item => 
      (item.full_name?.toLowerCase().includes(lower)) ||
      (item.email?.toLowerCase().includes(lower)) ||
      (item.name?.toLowerCase().includes(lower))
    );
  };

  const filteredUsers = filterItems(users, searchQuery);
  const filteredBusinesses = filterItems(businesses, searchQuery);
  const filteredOrgs = filterItems(orgs, searchQuery);

  const VerificationCard = ({ item, onVerify, onUnverify, isPending, type = 'user' }) => {
    const name = item.full_name || item.name || 'Unknown';
    const subtitle = item.email || item.contact_email || '';
    const isVerified = item.is_verified;

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm text-foreground truncate">{name}</p>
                {isVerified && (
                  <Star className="w-4 h-4 fill-gold text-gold flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
              {type !== 'user' && item.org_type && (
                <p className="text-xs text-muted-foreground mt-1 capitalize">{item.org_type}</p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isVerified ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onUnverify(item.id)}
                  disabled={isPending}
                >
                  Unverify
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="text-xs bg-primary hover:bg-primary/90"
                  onClick={() => onVerify(item.id)}
                  disabled={isPending}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Verify
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Members</span>
            <Badge variant="secondary" className="text-xs">
              {users.filter(u => u.is_verified).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="businesses" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden sm:inline">Businesses</span>
            <Badge variant="secondary" className="text-xs">
              {businesses.filter(b => b.is_verified).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="orgs" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="hidden sm:inline">Organizations</span>
            <Badge variant="secondary" className="text-xs">
              {orgs.filter(o => o.is_verified).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <Alert>
                <AlertDescription>No members found.</AlertDescription>
              </Alert>
            ) : (
              filteredUsers.map(user => (
                <VerificationCard
                  key={user.id}
                  item={user}
                  onVerify={verifyUserMutation.mutate}
                  onUnverify={unverifyUserMutation.mutate}
                  isPending={verifyUserMutation.isPending || unverifyUserMutation.isPending}
                  type="user"
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Businesses Tab */}
        <TabsContent value="businesses" className="mt-6">
          <div className="space-y-3">
            {filteredBusinesses.length === 0 ? (
              <Alert>
                <AlertDescription>No businesses found.</AlertDescription>
              </Alert>
            ) : (
              filteredBusinesses.map(business => (
                <VerificationCard
                  key={business.id}
                  item={business}
                  onVerify={verifyBusinessMutation.mutate}
                  onUnverify={unverifyBusinessMutation.mutate}
                  isPending={verifyBusinessMutation.isPending || unverifyBusinessMutation.isPending}
                  type="business"
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="orgs" className="mt-6">
          <div className="space-y-3">
            {filteredOrgs.length === 0 ? (
              <Alert>
                <AlertDescription>No organizations found.</AlertDescription>
              </Alert>
            ) : (
              filteredOrgs.map(org => (
                <VerificationCard
                  key={org.id}
                  item={org}
                  onVerify={verifyOrgMutation.mutate}
                  onUnverify={unverifyOrgMutation.mutate}
                  isPending={verifyOrgMutation.isPending || unverifyOrgMutation.isPending}
                  type="org"
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{users.filter(u => u.is_verified).length}</p>
          <p className="text-xs text-muted-foreground">Verified Members</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{businesses.filter(b => b.is_verified).length}</p>
          <p className="text-xs text-muted-foreground">Verified Businesses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{orgs.filter(o => o.is_verified).length}</p>
          <p className="text-xs text-muted-foreground">Verified Organizations</p>
        </div>
      </div>
    </div>
  );
}