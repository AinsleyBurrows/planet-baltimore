import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Eye, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const LITERARY_CATS = ['novel', 'short_story', 'poetry', 'play', 'screenplay', 'memoir', 'novella', 'flash_fiction', 'spoken_word', 'essay'];

export default function WritingExcerptsTab({ artistId, ownerId, isOwner }) {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ['literary-stories', ownerId],
    queryFn: () => base44.entities.Story.filter({ author_id: ownerId, status: 'published' }, '-published_at', 30),
    enabled: !!ownerId,
  });

  const literary = stories.filter(s => LITERARY_CATS.includes(s.category));

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Link to="/create-story"><Button size="sm" className="gap-1.5 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg"><Plus className="w-3.5 h-3.5" /> Publish Writing</Button></Link>
        </div>
      )}
      {literary.length === 0
        ? <p className="text-center py-12 text-sm text-muted-foreground">No writing published yet.</p>
        : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {literary.map(s => (
            <Link key={s.id} to={`/stories/${s.id}`} className="bg-card border border-border rounded-xl p-4 hover:border-accent transition-colors interactive-card block">
              <div className="flex gap-3">
                {s.cover_image && <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary"><img src={s.cover_image} alt="" className="w-full h-full object-cover" /></div>}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium uppercase">{(s.category || 'writing').replace('_', ' ')}</span>
                  <p className="font-semibold text-foreground text-sm mt-1 line-clamp-2">{s.title}</p>
                  {s.subtitle && <p className="text-xs text-muted-foreground italic truncate">{s.subtitle}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    {s.reading_time ? <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{s.reading_time} min</span> : null}
                    {s.views_count > 0 && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{s.views_count}</span>}
                  </div>
                </div>
              </div>
              {s.content && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.content.replace(/<[^>]+>/g, '').slice(0, 140)}</p>}
            </Link>
          ))}
        </div>}
    </div>
  );
}