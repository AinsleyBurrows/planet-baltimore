import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, User, Music, CheckCircle, AlertTriangle, CreditCard, ArrowRight, X, ArrowLeft } from 'lucide-react';

const BALTIMORE_LAT = 39.2904;
const BALTIMORE_LNG = -76.6122;
const RADIUS_MILES = 15;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Step 1: Role selection ───────────────────────────────────────
function StepRole({ onNext }) {
  return (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome to Planet Baltimore</h2>
        <p className="text-muted-foreground mt-2">How would you describe yourself?</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNext('artist')}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <Music className="w-7 h-7 text-accent" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Artist</div>
            <div className="text-xs text-muted-foreground mt-0.5">Performer, creator, podcaster</div>
          </div>
        </button>
        <button
          onClick={() => onNext('attendee')}
          className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
            <User className="w-7 h-7 text-accent" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Attendee</div>
            <div className="text-xs text-muted-foreground mt-0.5">Fan, supporter, community member</div>
          </div>
        </button>
      </div>
    </div>
  );
}

const AINSLEY_USER_ID = '69ea6b08dd7ab098a7066585';

// ── Step 2: Location verification ───────────────────────────────
function StepLocation({ onNext, onBack, onBlock, isAinsley }) {
  const [status, setStatus] = useState(isAinsley ? 'ok' : 'idle'); // idle | checking | denied | outside | ok

  // Auto-advance for Ainsley
  React.useEffect(() => {
    if (isAinsley) {
      setTimeout(onNext, 800);
    }
  }, [isAinsley]);

  const checkLocation = () => {
    setStatus('checking');
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = haversineDistance(pos.coords.latitude, pos.coords.longitude, BALTIMORE_LAT, BALTIMORE_LNG);
        if (dist <= RADIUS_MILES) {
          setStatus('ok');
          setTimeout(onNext, 800);
        } else {
          setStatus('outside');
        }
      },
      () => setStatus('denied'),
      { timeout: 10000 }
    );
  };

  return (
    <div className="text-center space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Confirm Your Location</h2>
        <p className="text-muted-foreground mt-2">Planet Baltimore is exclusively for people in the Baltimore area.</p>
      </div>

      <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center">
        <MapPin className="w-10 h-10 text-accent" />
      </div>

      {status === 'idle' && (
        <Button onClick={checkLocation} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-12">
          Allow Location Access
        </Button>
      )}

      {status === 'checking' && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Verifying your location…</span>
        </div>
      )}

      {status === 'ok' && (
        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
          <CheckCircle className="w-5 h-5" />
          <span>You're in the Baltimore area!</span>
        </div>
      )}

      {status === 'outside' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-left">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive text-sm">Outside Baltimore</p>
              <p className="text-xs text-destructive/80 mt-1">Planet Baltimore is only available to residents and visitors within 15 miles of Baltimore city center.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={() => setStatus('idle')}>Try Again</Button>
          <Button variant="ghost" className="w-full flex items-center gap-1.5 text-muted-foreground hover:text-foreground" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Back — join as Attendee instead
          </Button>
          <button onClick={onBlock} className="text-xs text-muted-foreground hover:text-foreground underline">
            This is wrong — I'm in Baltimore
          </button>
        </div>
      )}

      {status === 'denied' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Location access denied</p>
              <p className="text-xs text-amber-700 mt-1">Please allow location access in your browser settings to continue.</p>
            </div>
          </div>
          <Button onClick={checkLocation} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl">
            Try Again
          </Button>
          <Button variant="ghost" className="w-full flex items-center gap-1.5 text-muted-foreground hover:text-foreground" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" /> Back — choose a different role
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Name & email ─────────────────────────────────────────
function StepProfile({ currentUser, onNext }) {
  const [name, setName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.auth.updateMe({ display_name: name.trim() });
    setSaving(false);
    onNext({ display_name: name.trim() });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">Your Profile</h2>
        <p className="text-muted-foreground mt-2">Tell the community who you are.</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Display Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="How should we call you?"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} disabled className="mt-1.5 opacity-60" />
          <p className="text-xs text-muted-foreground mt-1">Your email is managed by your account.</p>
        </div>
      </div>
      <Button
        onClick={handleNext}
        disabled={!name.trim() || saving}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-12"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4 ml-1" /></>}
      </Button>
    </div>
  );
}

// ── Step 4: Stripe setup (artists only) ─────────────────────────
function StepStripe({ onNext, onSkip }) {
  const [connectId, setConnectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!connectId.trim().startsWith('acct_')) {
      setError('Please enter a valid Stripe Connect ID (starts with acct_).');
      return;
    }
    setSaving(true);
    try {
      const res = await base44.functions.invoke('verifyStripeAccount', { stripe_connect_id: connectId.trim() });
      if (res.data?.verified) {
        onNext({ stripe_connect_id: connectId.trim() });
      } else {
        setError('Could not verify this Stripe account. Please check the ID and try again.');
      }
    } catch {
      setError('Verification failed. Please try again.');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <CreditCard className="w-7 h-7 text-accent" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Connect Stripe</h2>
        <p className="text-muted-foreground mt-2 text-sm">Needed to sell tickets and receive payments for your events.</p>
      </div>
      <div>
        <Label>Stripe Connect Account ID</Label>
        <Input
          value={connectId}
          onChange={(e) => { setConnectId(e.target.value); setError(''); }}
          placeholder="acct_1AbcDefGhiJklMno"
          className="mt-1.5 font-mono text-sm"
        />
        {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
        <p className="text-xs text-muted-foreground mt-1.5">
          Find this in your <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline text-accent">Stripe Dashboard</a> under Settings → Account details.
        </p>
      </div>
      <div className="space-y-2">
        <Button
          onClick={handleSave}
          disabled={!connectId.trim() || saving}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl h-12"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Continue'}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground hover:text-foreground">
          Skip for now
        </Button>
      </div>
    </div>
  );
}

// ── Step 5: Done ─────────────────────────────────────────────────
function StepDone({ role }) {
  return (
    <div className="text-center space-y-4">
      <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">You're all set!</h2>
      <p className="text-muted-foreground">
        {role === 'artist'
          ? 'Welcome to Planet Baltimore. Your artist account is ready — start creating!'
          : 'Welcome to Planet Baltimore. Discover events and connect with artists in your city!'}
      </p>
    </div>
  );
}

// ── Main orchestrator ────────────────────────────────────────────
export default function OnboardingFlow({ currentUser, onComplete }) {
  const [step, setStep] = useState('role'); // role | location | profile | stripe | done
  const [role, setRole] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const isAinsley = currentUser?.id === AINSLEY_USER_ID;

  const handleRoleNext = (selectedRole) => {
    setRole(selectedRole);
    // Only artists need Baltimore location verification
    setStep(selectedRole === 'artist' ? 'location' : 'profile');
  };

  const handleLocationNext = () => setStep('profile');

  const handleProfileNext = async () => {
    if (role === 'artist') {
      setStep('stripe');
    } else {
      // Attendee — mark complete, no Stripe needed
      const updates = {
        account_type: 'attendee',
        onboarding_complete: true,
        stripe_skipped: false,
      };
      // Always stamp Ainsley as Baltimore
      if (isAinsley) {
        updates.neighborhood_names = ['Baltimore'];
      }
      await base44.auth.updateMe(updates);
      setStep('done');
      setTimeout(onComplete, 1800);
    }
  };

  const handleStripeNext = async ({ stripe_connect_id }) => {
    const updates = { account_type: 'artist', onboarding_complete: true, stripe_skipped: false };
    if (isAinsley) updates.neighborhood_names = ['Baltimore'];
    await base44.auth.updateMe(updates);
    setStep('done');
    setTimeout(onComplete, 1800);
  };

  const handleStripeSkip = async () => {
    const updates = { account_type: 'artist', onboarding_complete: true, stripe_skipped: true };
    if (isAinsley) updates.neighborhood_names = ['Baltimore'];
    await base44.auth.updateMe(updates);
    setStep('done');
    setTimeout(onComplete, 1800);
  };

  if (blocked) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <X className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm">Planet Baltimore is only available to people in the Baltimore metro area. If you believe this is an error, please contact support.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress dots */}
      {step !== 'done' && (
        <div className="flex justify-center gap-2 mb-8">
          {['role', ...(role === 'artist' ? ['location'] : []), 'profile', ...(role === 'artist' ? ['stripe'] : [])].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${step === s ? 'bg-accent w-6' : ['role', 'location', 'profile', 'stripe'].indexOf(step) > i ? 'bg-accent/50' : 'bg-border'}`}
            />
          ))}
        </div>
      )}

      {step === 'role' && <StepRole onNext={handleRoleNext} />}
      {step === 'location' && <StepLocation onNext={handleLocationNext} onBack={() => setStep('role')} onBlock={() => setBlocked(true)} isAinsley={isAinsley} />}
      {step === 'profile' && <StepProfile currentUser={currentUser} onNext={handleProfileNext} />}
      {step === 'stripe' && <StepStripe onNext={handleStripeNext} onSkip={handleStripeSkip} />}
      {step === 'done' && <StepDone role={role} />}
    </div>
  );
}