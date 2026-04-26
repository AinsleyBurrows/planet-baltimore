import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import PromoCodeForm from './PromoCodeForm';

export default function PromoCodeManager({ eventId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState(null);

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['promo-codes', eventId],
    queryFn: () => base44.entities.PromoCode.filter({ event_id: eventId }, '-created_date', 50),
    enabled: !!eventId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PromoCode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promo-codes', eventId] }),
  });

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Promotional Codes</h3>
        <Button
          size="sm"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Create Code
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">Loading codes...</div>
      ) : promoCodes.length === 0 ? (
        <div className="text-center py-8 bg-secondary/30 rounded-xl border border-border">
          <p className="text-muted-foreground text-sm">No promotional codes yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {promoCodes.map(promo => (
            <div key={promo.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <code className="font-mono font-bold text-accent text-sm">{promo.code}</code>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                  </Badge>
                  {!promo.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                  <span>Used: {promo.usage_count || 0}{promo.usage_limit ? `/${promo.usage_limit}` : ''}</span>
                  {promo.valid_until && <span>Expires: {format(new Date(promo.valid_until), 'MMM d')}</span>}
                  {promo.min_purchase_qty && <span>Min: {promo.min_purchase_qty} tickets</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(promo.code)}
                  className="gap-1.5"
                >
                  {copied === promo.code ? (
                    <><Check className="w-3.5 h-3.5 text-green-500" /> Copied</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setEditing(promo); setShowForm(true); }}
                  className="gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(promo.id)}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PromoCodeForm
          eventId={eventId}
          promo={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['promo-codes', eventId] });
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}