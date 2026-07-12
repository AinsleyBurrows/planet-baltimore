import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { RefreshCw, UserCog, Music, User as UserIcon, Loader2 } from 'lucide-react';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { useToast } from '@/components/ui/use-toast';

export default function SettingsOnboarding({ user, onSaved }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [switching, setSwitching] = useState(false);
  const { toast } = useToast();

  const handleRedoOnboarding = () => {
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await onSaved?.();
    toast({ title: 'Onboarding complete', description: 'Your account settings have been updated.' });
  };

  const handleQuickSwitch = async (type) => {
    setSwitching(true);
    try {
      await base44.auth.updateMe({ account_type: type, onboarding_complete: true });
      await onSaved?.();
      toast({
        title: 'Account type updated',
        description: `You are now registered as ${type === 'artist' ? 'an Artist' : 'an Attendee'}.`,
      });
    } catch (err) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
    setSwitching(false);
  };

  const currentType = user?.account_type || 'attendee';

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
          <UserCog className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Onboarding & Account Type</h2>
          <p className="text-sm text-muted-foreground">Redo the onboarding flow or switch your account type.</p>
        </div>
      </div>

      {/* Current account type */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-1">Current account type</p>
        <div className="flex items-center gap-2">
          {currentType === 'artist' ? (
            <Music className="w-5 h-5 text-accent" />
          ) : (
            <UserIcon className="w-5 h-5 text-accent" />
          )}
          <span className="font-semibold text-foreground capitalize">{currentType}</span>
        </div>
      </div>

      {/* Quick account type switch */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Quick switch</p>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={currentType === 'artist' ? 'default' : 'outline'}
            disabled={switching || currentType === 'artist'}
            onClick={() => handleQuickSwitch('artist')}
            className="justify-start"
          >
            <Music className="w-4 h-4" />
            Artist
          </Button>
          <Button
            variant={currentType === 'attendee' ? 'default' : 'outline'}
            disabled={switching || currentType === 'attendee'}
            onClick={() => handleQuickSwitch('attendee')}
            className="justify-start"
          >
            <UserIcon className="w-4 h-4" />
            Attendee
          </Button>
        </div>
        {switching && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Updating…
          </div>
        )}
      </div>

      {/* Redo full onboarding */}
      <div className="border-t border-border pt-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Redo onboarding</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Restart the full onboarding flow to reselect your role, verify location, set up your profile, and connect Stripe.
          </p>
        </div>
        <Button onClick={handleRedoOnboarding} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="w-4 h-4" />
          Redo Onboarding
        </Button>
      </div>

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal currentUser={user} onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}