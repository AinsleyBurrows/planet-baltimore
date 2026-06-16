import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import StripeSetupPanel from '@/components/artist/StripeSetupPanel';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsStripe({ userId }) {
  const queryClient = useQueryClient();

  const { data: artistPages = [], isLoading } = useQuery({
    queryKey: ['my-artist-pages-settings', userId],
    queryFn: () => base44.entities.ArtistPage.filter({ owner_id: userId }),
    enabled: !!userId,
    staleTime: 30000,
  });

  const [selectedArtistId, setSelectedArtistId] = useState(null);

  useEffect(() => {
    if (artistPages.length > 0 && !selectedArtistId) {
      setSelectedArtistId(artistPages[0].id);
    }
  }, [artistPages]);

  const selectedArtist = artistPages.find(a => a.id === selectedArtistId);

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  if (artistPages.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center space-y-2">
        <p className="text-sm font-medium text-foreground">No Artist Pages Found</p>
        <p className="text-xs text-muted-foreground">
          You need an artist page before you can configure Stripe. Create one first under Artists.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Stripe Payment Setup</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your Stripe account to sell tickets for your events.
        </p>
      </div>

      {artistPages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {artistPages.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedArtistId(a.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                selectedArtistId === a.id
                  ? 'bg-accent text-accent-foreground border-accent'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      {selectedArtist && (
        <div className="bg-card border border-border rounded-xl p-5">
          <StripeSetupPanel
            artist={selectedArtist}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ['my-artist-pages-settings', userId] })}
          />
        </div>
      )}
    </div>
  );
}