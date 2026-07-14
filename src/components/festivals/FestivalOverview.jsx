import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function FestivalOverview({ festivals = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* About section */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-foreground">About Baltimore Festivals</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Baltimore is a city of festivals — a dynamic collision of art, culture, and community impact.
          From Artscape to AFRAM, the city transforms into a living, breathing canvas of creativity.
          Planet Baltimore brings these festivals together in one hub: discover lineups, RSVP, explore vendor maps,
          and connect with the artists and makers who make Baltimore's creative scene unlike any other.
        </p>
      </div>

      {/* Upcoming festivals grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Upcoming Festivals</h2>
          <Link to="/discover" className="text-sm text-accent hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {festivals.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming festivals yet — check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {festivals.map(festival => (
              <Link
                key={festival.id}
                to={`/events/${festival.id}`}
                className="bg-card border border-border rounded-2xl overflow-hidden interactive-card group"
              >
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  {festival.image_url ? (
                    <img
                      src={festival.image_url}
                      alt={festival.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-1.5">
                  {festival.is_featured && (
                    <span className="inline-block text-xs font-medium bg-accent/10 text-accent px-2 py-0.5 rounded-full">Featured</span>
                  )}
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">{festival.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {festival.date ? new Date(festival.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBA'}
                    </span>
                    {festival.venue_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {festival.venue_name}
                      </span>
                    )}
                  </div>
                  {festival.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{festival.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 sm:p-8 text-center">
        <h2 className="text-lg font-bold text-foreground mb-2">Want to list your festival?</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Create a festival event on Planet Baltimore and reach thousands of local attendees.
        </p>
        <Link to="/create-event">
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Create a Festival
          </Button>
        </Link>
      </div>
    </div>
  );
}