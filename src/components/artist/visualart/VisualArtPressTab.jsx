import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Award, Newspaper, ExternalLink, Quote } from 'lucide-react';

export default function VisualArtPressTab({ artistId }) {
  const { data: cv, isLoading } = useQuery({ queryKey: ['artist-cv-press', artistId], queryFn: () => base44.entities.ArtistCV.filter({ artist_id: artistId }, '-created_date', 1).then(r => r[0] || null), enabled: !!artistId });
  if (isLoading) return <div className="h-20 rounded-xl bg-muted animate-pulse" />;
  const press = cv?.press || [];
  const awards = cv?.awards || [];
  const publications = cv?.publications || [];
  const empty = press.length === 0 && awards.length === 0 && publications.length === 0;

  if (empty) return <div className="text-center py-12 text-sm text-muted-foreground"><Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />No press or recognition added yet.</div>;

  return (
    <div className="space-y-6">
      {press.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Quote className="w-3.5 h-3.5" />Press</h3>
          <div className="space-y-2">
            {press.map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                {p.title && <p className="font-semibold text-sm text-foreground">{p.title}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{[p.year, p.publication].filter(Boolean).join(' · ')}</p>
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline mt-1 inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />Read</a>}
              </div>
            ))}
          </div>
        </div>
      )}
      {awards.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />Awards</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {awards.map((a, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-start gap-2">
                <Award className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                <div><p className="font-semibold text-sm text-foreground">{a.title}</p>{(a.organization || a.year) && <p className="text-xs text-muted-foreground mt-0.5">{[a.year, a.organization].filter(Boolean).join(' · ')}</p>}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {publications.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5" />Publications</h3>
          <div className="space-y-2">
            {publications.map((p, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3">
                <p className="font-semibold text-sm text-foreground">{p.title}</p>
                {(p.publisher || p.year) && <p className="text-xs text-muted-foreground mt-0.5">{[p.year, p.publisher].filter(Boolean).join(' · ')}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}