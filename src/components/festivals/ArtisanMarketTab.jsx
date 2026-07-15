import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ArtVendorCard from '@/components/festivals/ArtVendorCard';
import AddArtVendorModal from '@/components/festivals/AddArtVendorModal';

const ACCENT = '#d4580a';

export default function ArtisanMarketTab() {
  const { user } = useCurrentUser();
  const [showAdd, setShowAdd] = useState(false);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['art-vendors'],
    queryFn: () => base44.entities.ArtVendor.list('sort_order', 200),
    staleTime: 30000,
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-5 bg-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Artisan Market</h2>
            <p className="text-sm text-muted-foreground max-w-2xl">Add art vendors of all kinds — jewelry, pottery, painting, textile, woodwork, glass, and more.</p>
          </div>
          {user && (
            <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 rounded-lg flex-shrink-0" style={{ borderColor: ACCENT, color: ACCENT }}>
              <Plus className="w-4 h-4" /> Add Vendor
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Palette className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No art vendors yet</h3>
          <p className="text-sm text-muted-foreground">Add the first art vendor to the market.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map(v => <ArtVendorCard key={v.id} vendor={v} />)}
        </div>
      )}

      {showAdd && <AddArtVendorModal open={showAdd} onOpenChange={setShowAdd} />}
    </div>
  );
}