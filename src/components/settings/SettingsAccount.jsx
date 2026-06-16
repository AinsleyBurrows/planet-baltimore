import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Check, MapPin, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsAccount({ user, onSaved }) {
  const { toast } = useToast();
  const [neighborhood, setNeighborhood] = useState('');
  const [saving, setSaving] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  useEffect(() => {
    if (user) setNeighborhood(user.neighborhood_names?.[0] || '');
  }, [user?.id]);

  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods'],
    queryFn: () => base44.entities.Neighborhood.list('name', 500),
    staleTime: 300000,
  });

  const handleSaveNeighborhood = async () => {
    setSaving(true);
    const selected = neighborhoods.find(n => n.name === neighborhood);
    await base44.auth.updateMe({
      neighborhood_names: neighborhood ? [neighborhood] : [],
      neighborhoods: selected ? [selected.id] : [],
    });
    setSaving(false);
    onSaved?.();
    toast({ title: 'Neighborhood updated' });
  };

  const handleResetOnboarding = async () => {
    setResettingOnboarding(true);
    await base44.auth.updateMe({ onboarding_complete: false });
    setResettingOnboarding(false);
    onSaved?.();
    toast({ title: 'Onboarding reset — reload to see the flow again' });
  };

  return (
    <div className="space-y-4">
      {/* Account Type */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Account Info</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your account type and status.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Account Type</p>
            <Badge variant="secondary" className="capitalize text-sm">
              {user?.account_type || 'Not set'}
            </Badge>
          </div>
          {user?.is_verified && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Badge className="bg-accent/10 text-accent border-accent/20">Verified</Badge>
            </div>
          )}
          {user?.is_founding_member && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Badge</p>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Founding Member</Badge>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Email</p>
          <p className="text-sm text-foreground font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Neighborhood */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" /> Neighborhood
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Your Baltimore neighborhood association.</p>
        </div>

        <div>
          <Label>Select Neighborhood</Label>
          <select
            value={neighborhood}
            onChange={e => setNeighborhood(e.target.value)}
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">— None —</option>
            {neighborhoods.map(n => (
              <option key={n.id} value={n.name}>{n.name}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleSaveNeighborhood}
          disabled={saving || neighborhood === (user?.neighborhood_names?.[0] || '')}
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"
          size="sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1.5" />Save</>}
        </Button>
      </div>

      {/* Re-run onboarding */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-foreground">Onboarding</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Re-run the setup flow to change your role or Stripe info.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetOnboarding}
          disabled={resettingOnboarding}
          className="rounded-lg"
        >
          {resettingOnboarding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
          Re-run Onboarding
        </Button>
      </div>
    </div>
  );
}