import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Mic, Play, Pause, ExternalLink, Search, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// ── Mini audio player for each episode row ──────────────────────────
function EpisodePlayer({ episode, podcastName }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  if (!episode.audio_url && !episode.spotify_url && !episode.apple_url && !episode.youtube_url) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {episode.audio_url && (
        <>
          <audio ref={audioRef} src={episode.audio_url} onEnded={() => setPlaying(false)} className="hidden" />
          <button
            onClick={toggle}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ backgroundColor: '#d4580a' }}
          >
            {playing
              ? <Pause className="w-3.5 h-3.5 text-white" fill="white" />
              : <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
            }
          </button>
        </>
      )}
      {episode.spotify_url && (
        <a href={episode.spotify_url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          🎧 Spotify <ExternalLink className="w-3 h-3" />
        </a>
      )}
      {episode.apple_url && (
        <a href={episode.apple_url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          🎙️ Apple <ExternalLink className="w-3 h-3" />
        </a>
      )}
      {episode.youtube_url && (
        <a href={episode.youtube_url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          ▶️ YouTube <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

// ── Single episode row ───────────────────────────────────────────────
function EpisodeRow({ episode, podcastName, coverFallback }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 font-bold text-accent text-sm overflow-hidden">
        {episode.cover_url
          ? <img src={episode.cover_url} alt="" className="w-full h-full object-cover" />
          : coverFallback
            ? <img src={coverFallback} alt="" className="w-full h-full object-cover" />
            : <Mic className="w-5 h-5 text-accent" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug truncate">{episode.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
          {episode.episode_number && <span>Ep. {episode.episode_number}</span>}
          {episode.duration && <span>{episode.duration}</span>}
          {episode.published_at && (
            <span>{format(new Date(episode.published_at), 'MMM d, yyyy')}</span>
          )}
        </div>
        {episode.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{episode.description}</p>
        )}
        <EpisodePlayer episode={episode} podcastName={podcastName} />
      </div>
    </div>
  );
}

// ── Podcast show card ────────────────────────────────────────────────
function PodcastCard({ artist }) {
  const episodes = artist.podcast_episodes || [];
  const links = artist.podcast_links || {};
  const latest = episodes[0];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Avatar className="w-16 h-16 rounded-xl flex-shrink-0">
          <AvatarImage src={artist.image_url} className="rounded-xl object-cover" />
          <AvatarFallback className="rounded-xl bg-accent/10 text-accent text-xl font-bold">{artist.name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Link to={`/artists/${artist.id}`} className="font-bold text-foreground hover:text-[#d4580a] transition-colors block truncate">
            {artist.name}
          </Link>
          {artist.neighborhood_name && (
            <p className="text-xs text-muted-foreground mt-0.5">{artist.neighborhood_name}</p>
          )}
          {artist.bio && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{artist.bio}</p>
          )}
          {/* Platform links */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {links.spotify && <a href={links.spotify} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">🎧 Spotify</a>}
            {links.apple_podcasts && <a href={links.apple_podcasts} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">🎙️ Apple</a>}
            {links.youtube && <a href={links.youtube} target="_blank" rel="noopener noreferrer" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">▶️ YouTube</a>}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <Badge variant="secondary" className="text-xs">{episodes.length} ep{episodes.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Latest episode */}
      {latest && (
        <div className="border-t border-border px-4 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-3 mb-1">Latest Episode</p>
          <EpisodeRow episode={latest} podcastName={artist.name} coverFallback={artist.image_url} />
        </div>
      )}

      {/* View all episodes link */}
      {episodes.length > 1 && (
        <div className="border-t border-border px-4 py-2">
          <Link to={`/artists/${artist.id}`} className="flex items-center justify-between text-xs font-medium transition-colors hover:text-[#d4580a]" style={{ color: '#d4580a' }}>
            View all {episodes.length} episodes
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main Podcasts page ───────────────────────────────────────────────
export default function Podcasts() {
  const [search, setSearch] = useState('');

  const { data: podcasters = [], isLoading } = useQuery({
    queryKey: ['podcasters'],
    queryFn: () => base44.entities.ArtistPage.filter({ category: 'podcaster' }, '-created_date', 50),
    staleTime: 120000,
  });

  const q = search.toLowerCase().trim();
  const filtered = podcasters.filter(p =>
    !p.is_muted && (
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.bio?.toLowerCase().includes(q) ||
      p.neighborhood_name?.toLowerCase().includes(q) ||
      p.podcast_episodes?.some(ep => ep.title?.toLowerCase().includes(q))
    )
  );

  // Sort: podcasters with episodes first, then by episode count desc
  const sorted = [...filtered].sort((a, b) => {
    const aCount = a.podcast_episodes?.length || 0;
    const bCount = b.podcast_episodes?.length || 0;
    return bCount - aCount;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 sm:p-10 bg-transparent border-2" style={{ borderColor: '#d4580a' }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#d4580a' }}>
              <Mic className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: '#d4580a' }}>Planet Baltimore Podcasts</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">Real voices, real stories from Baltimore creators.</p>
        </div>
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: '#d4580a' }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search podcasts or episodes…"
          className="pl-10 h-11 rounded-xl bg-secondary border-0"
        />
      </div>

      {/* CTA for podcasters */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading podcasts…' : `${sorted.length} podcast${sorted.length !== 1 ? 's' : ''} on Planet Baltimore`}
        </p>
        <Link
          to="/create-artist"
          className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-secondary"
          style={{ borderColor: '#d4580a', color: '#d4580a' }}
        >
          + Add your podcast
        </Link>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
            <Mic className="w-7 h-7 text-accent" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            {q ? `No podcasts match "${search}"` : 'No podcasts yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {q ? 'Try a different search term.' : 'Baltimore podcasters will appear here once they create their pages.'}
          </p>
          {!q && (
            <Link
              to="/create-artist"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: '#d4580a' }}
            >
              <Mic className="w-4 h-4" /> Create your podcast page
            </Link>
          )}
        </div>
      )}

      {/* Podcast cards */}
      {!isLoading && sorted.length > 0 && (
        <div className="space-y-4">
          {sorted.map(artist => (
            <PodcastCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
}