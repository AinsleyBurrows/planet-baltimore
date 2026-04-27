import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tag, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PromoCodeSection({ eventId, ticketTypeId, quantity, onApply }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [isApplied, setIsApplied] = useState(false);

  const applyMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('validatePromoCode', {
        code: code.toUpperCase(),
        eventId,
        ticketTypeId,
        quantity,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.valid) {
        setResult({ discount: data.discount, type: data.type, message: `${data.discountLabel} applied!` });
        setIsApplied(true);
        onApply?.(data);
      }
    },
    onError: (error) => {
      setResult({ error: error.message || 'Code not valid for this event' });
    },
  });

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <label className="text-sm font-medium text-foreground">Promo Code</label>
      </div>

      {!isApplied ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={applyMutation.isPending}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-sm outline-none focus:ring-1 focus:ring-accent"
          />
          <Button
            size="sm"
            onClick={() => applyMutation.mutate()}
            disabled={!code.trim() || applyMutation.isPending}
            variant="outline"
            className="text-xs"
          >
            Apply
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
          <Check className="w-4 h-4 text-green-600" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-600">{code}</p>
            <p className="text-xs text-green-600/80">{result.message}</p>
          </div>
          <button
            onClick={() => {
              setIsApplied(false);
              setCode('');
              setResult(null);
              onApply?.(null);
            }}
            className="text-xs text-green-600 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      {result?.error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-xs text-destructive">{result.error}</p>
        </div>
      )}
    </div>
  );
}