import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, MapPin, Ticket, Users, Sparkles } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import FestivalOverview from '@/components/festivals/FestivalOverview';
import FestivalSchedule from '@/components/festivals/FestivalSchedule';
import FestivalArtistGallery from '@/components/festivals/FestivalArtistGallery';
import FestivalVendorMap from '@/components/festivals/FestivalVendorMap';
import FestivalTickets from '@/components/festivals/FestivalTickets';
import FestivalSponsors from '@/components/festivals/FestivalSponsors';
import FestivalFAQ from '@/components/festivals/FestivalFAQ';
import FestivalMainStage from '@/components/festivals/FestivalMainStage';

export default function Festivals() {
  const [activeTab, setActiveTab] = useState('overview');

  // Featured festival events
  const { data: festivals = [], isLoading } = useQuery({
    queryKey: ['festivals'],
    queryFn: () => base44.entities.Event.filter({ category: 'festival' }, 'date', 50),
  });

  const featured = festivals.find(f => f.is_featured) || festivals[0];
  const now = new Date();
  const upcoming = festivals.filter(f => {
    const end = f.end_date ? new Date(f.end_date) : new Date(f.date);
    return end >= now && !f.is_hidden;
  });

  return (
    <div className="space-y-0">
      {/* Hero banner */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-6 mb-6 h-[260px] sm:h-[340px] overflow-hidden">
        <img
          src={featured?.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80'}
          alt="Baltimore Festivals"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        <div className="relative h-full flex flex-col justify-end max-w-4xl mx-auto px-4 sm:px-6 pb-6 sm:pb-10">
          <div className="flex items-center gap-2 text-white/90 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Planet Baltimore Festivals</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
            Baltimore's Festival Hub
          </h1>
          <p className="text-white/80 mt-2 text-sm sm:text-lg max-w-2xl">
            Art, music, culture, and community — all in one place. Discover upcoming festivals, explore lineups, and plan your weekend.
          </p>
          {featured && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 text-white/90 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {featured.date ? new Date(featured.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Dates TBA'}
              </span>
              {featured.venue_name && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {featured.venue_name}
                </span>
              )}
              {featured.rsvp_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {featured.rsvp_count} attending
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Upcoming Festivals', value: isLoading ? '—' : upcoming.length, icon: Calendar },
          { label: 'Artists', value: '—', icon: Users },
          { label: 'Free to Attend', value: 'Yes', icon: Ticket },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:w-full justify-start sm:justify-center h-auto py-1 gap-1">
            <TabsTrigger value="overview" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="mainstage" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">Main Stage</TabsTrigger>
            <TabsTrigger value="schedule" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">Schedule</TabsTrigger>
            <TabsTrigger value="artists" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">Artists</TabsTrigger>
            <TabsTrigger value="vendors" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">Vendor Map</TabsTrigger>
            <TabsTrigger value="tickets" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">Tickets</TabsTrigger>
            <TabsTrigger value="sponsors" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">Sponsors</TabsTrigger>
            <TabsTrigger value="faq" className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm">FAQ</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <FestivalOverview festivals={upcoming} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="mainstage" className="mt-6">
          <FestivalMainStage />
        </TabsContent>
        <TabsContent value="schedule" className="mt-6">
          <FestivalSchedule festivals={upcoming} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="artists" className="mt-6">
          <FestivalArtistGallery />
        </TabsContent>
        <TabsContent value="vendors" className="mt-6">
          <FestivalVendorMap />
        </TabsContent>
        <TabsContent value="tickets" className="mt-6">
          <FestivalTickets festivals={upcoming} />
        </TabsContent>
        <TabsContent value="sponsors" className="mt-6">
          <FestivalSponsors />
        </TabsContent>
        <TabsContent value="faq" className="mt-6">
          <FestivalFAQ />
        </TabsContent>
      </Tabs>
    </div>
  );
}