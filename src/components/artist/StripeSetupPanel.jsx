import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';

export default function StripeSetupPanel({ artist, onSaved }) {
  const queryClient = useQueryClient();
  const [connectId, setConnectId] = useState(artist?.stripe_connect_id || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const isVerified = artist?.stripe_key_verified;

  const handleVerify = async () => {
    if (!connectId.trim()) return;
    setLoading(true);
    setResult(null);
    const response = await base44.functions.invoke('verifyStripeAccount', {
      connectId: connectId.trim(),
      artistPageId: artist?.id,
    });
    const data = response.data;
    setResult(data);
    if (data.valid) {
      queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
      if (onSaved) onSaved({ stripe_connect_id: connectId.trim(), stripe_key_verified: data.verified });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Stripe Payment Setup</h3>
        {isVerified && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Connected
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        To sell tickets through Planet Baltimore, you need a Stripe account. Ticket revenue goes directly to your Stripe account. Planet Baltimore collects only the $0.65 service fee and 6% Baltimore tax.
      </p>
      <a
        href="https://stripe.com/connect"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        Don't have a Stripe account? Create one at stripe.com
      </a>

      <div>
        <Label className="text-xs">Stripe Secret Key</Label>
        <p className="text-xs text-muted-foreground mb-1.5">
          Find this at stripe.com → Developers → API keys. It starts with <code className="bg-secondary px-1 rounded">sk_</code>
        </p>
        <div className="flex gap-2">
          <Input
            value={connectId}
            onChange={e => setConnectId(e.target.value)}
            placeholder="sk_live_xxxxxxxxxxxxxxxxxx"
            className="font-mono text-xs"
          />
          <Button
            onClick={handleVerify}
            disabled={loading || !connectId.trim()}
            size="sm"
            className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Save'}
          </Button>
        </div>
      </div>

      {result && (
        <div className={`flex items-start gap-2 text-xs p-3 rounded-lg ${result.valid ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {result.valid
            ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          <span>{result.message || result.error}</span>
        </div>
      )}

      <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Fee breakdown (per ticket):</p>
        <p>• Artists receive their full ticket revenue</p>
        <p>• $0.65 service fee added at checkout</p>
        <p>• 6% Baltimore tax added at checkout</p>
        <p className="text-muted-foreground italic mt-1">These fees are shown transparently to buyers at checkout.</p>
      </div>
    </div>
  );
}