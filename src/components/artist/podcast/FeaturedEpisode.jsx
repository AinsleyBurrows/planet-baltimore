import React from 'react';
import { Pin, ExternalLink, Mic, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

export default function FeaturedEpisode({ artist, isOwner }) {
  const queryClient = useQueryClient();
  const episodes = artist.podcast_episodes || [];
  const featured = episodes.find(ep => ep.is_featured);

  const unpin = async () => {
    const updated = episodes.map(ep => ({ ...ep, is_featured: false }));
    await base44.entities.ArtistPage.update(artist.id, { podcast_episodes: updated });
    queryClient.invalidateQueries({ queryKey: ['artist', artist.id] });
  };

  if (!featured) return null;

  const listenUrl = featured.spotify_url || featured.apple_url || featured.youtube_url || featured.audio_url;

  return (
    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 via-accent/10 to-card border border-accent/30 p-5 mb-5">
      {/* Badge */}
      <div className="flex items-center gap-1.5 mb-3">
        <Star className="w-3.5 h-3.5 text-accent fill-accent" />
        <span className="text-xs font-bold text-accent uppercase tracking-wide">Featured Episode</span>
      </div>

      <div className="flex gap-4 items-start">
        {/* Cover / icon */}
        {featured.cover_url ? (
          <img src={featured.cover_url} alt={featured.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Mic className="w-8 h-8 text-accent" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-bold text-base text-foreground leading-snug line-clamp-2">{featured.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {featured.episode_number && <span>Ep. {featured.episode_number}</span>}
            {featured.duration && <span>· {featured.duration}</span>}
            {featured.published_at && (
              <span>· {new Date(featured.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>
          {featured.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{featured.description}</p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {featured.audio_url && (
              <audio controls className="h-8 max-w-xs" style={{ height: '32px' }}>
                <source src={featured.audio_url} />
              </audio>
            )}
            {listenUrl && (
              <a href={listenUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="gap-1.5 text-xs h-8">
                  <ExternalLink className="w-3.5 h-3.5" /> Listen Now
                </Button>
              </a>
            )}
            {isOwner && (
              <button onClick={unpin}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                <Pin className="w-3 h-3" /> Unpin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}