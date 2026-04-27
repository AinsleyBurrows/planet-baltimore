import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import EventCard from '@/components/shared/EventCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

export default function EventRecommendations() {
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['event-recommendations'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getEventRecommendations', {});
      return res.data?.recommendations || [];
    },
    staleTime: 1800000, // 30 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Recommended For You</h2>
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">Recommended For You</h2>
      </div>
      <div className="space-y-3">
        {recommendations.slice(0, 3).map((event) => (
          <div key={event.id} className="relative">
            <EventCard event={event} compact />
            {event.score && (
              <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold">
                {Math.round(event.score)}/10 match
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}