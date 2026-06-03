import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const FEATURED_EPISODES = [
  {
    id: 1,
    show: 'The Inner Harbor Report',
    title: 'Episode #42: Revitalizing the Waterfront',
    host: 'Host: Sarah Jenkins',
    duration: '45 mins',
    image: 'https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?w=200&q=80',
  },
  {
    id: 2,
    show: 'Bmore Voices',
    title: 'Episode #15: The Art of Community',
    host: 'Host: Maria Garcia',
    duration: '52 mins',
    image: 'https://images.unsplash.com/photo-1429976129-80ce3499cd0b?w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1429976129-80ce3499cd0b?w=200&q=80',
  },
  {
    id: 3,
    show: 'Art & Alleyways',
    title: 'Episode #8: Station North Deep Dive',
    host: 'Host: Ben Thompson',
    duration: '38 mins',
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80',
    cover: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=200&q=80',
  },
];

const PODCAST_SHOWS = [
  {
    id: 1,
    title: 'Charm City Beats',
    host: 'Alex Rodriguez',
    episodes: 32,
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&q=80',
  },
  {
    id: 2,
    title: 'Bmore Voices',
    host: 'Maria Garcia',
    episodes: 32,
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80',
  },
  {
    id: 3,
    title: 'Art & Alleyways',
    host: 'Ben Thompson',
    episodes: 32,
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=300&q=80',
  },
  {
    id: 4,
    title: 'The Daily Grind',
    host: 'Tanya Singh',
    episodes: 32,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80',
  },
  {
    id: 5,
    title: 'Baltimore Talks',
    host: 'Ben Carter',
    episodes: 12,
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&q=80',
  },
];

const LATEST_EPISODES = [
  {
    id: 1,
    ep: 'Ep. 43: Local Music Scene Deep Dive',
    show: 'Podcast Show Inera',
    duration: '38 mins',
    date: { month: 'OCT', day: '12' },
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&q=80',
    category: 'Music',
  },
  {
    id: 2,
    ep: 'Ep. 21: Community Gardens Impact',
    show: 'Community Gardens Impact',
    duration: '38 mins',
    date: { month: 'OCT', day: '12' },
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=100&q=80',
    category: 'Community',
  },
  {
    id: 3,
    ep: 'Ep. 18: Mural Arts of Station North',
    show: 'Mural Arts of Station North',
    duration: '38 mins',
    date: { month: 'OCT', day: '12' },
    image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=100&q=80',
    category: 'Arts',
  },
];

const CATEGORIES = ['All', 'Music', 'Culture', 'Community', 'Arts', 'Food', 'Politics'];

export default function Podcasts() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [playing, setPlaying] = useState(true);
  const [subscribedShows, setSubscribedShows] = useState({});
  const [currentEpisode] = useState(FEATURED_EPISODES[0]);

  const toggleSubscribe = (id) => {
    setSubscribedShows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEpisodes = activeCategory === 'All'
    ? LATEST_EPISODES
    : LATEST_EPISODES.filter(e => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Hero Section */}
      <div className="px-6 pt-10 pb-6 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-[#1E293B] mb-1">Planet Baltimore Podcasts</h1>
        <p className="text-[#64748B] text-base mb-6">Stories from the city</p>

        {/* Featured Episodes Carousel */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide">
          {FEATURED_EPISODES.map((ep, i) => (
            <div
              key={ep.id}
              className={`flex-shrink-0 rounded-xl overflow-hidden flex items-center gap-4 ${i === 0 ? 'w-[520px]' : 'w-[200px]'}`}
              style={{ backgroundColor: '#1E3A5F', minHeight: '180px' }}
            >
              {i === 0 ? (
                <>
                  {/* Full featured card */}
                  <div className="relative flex-shrink-0 w-44 h-44 self-stretch">
                    <img src={ep.image} alt={ep.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 text-[#1E3A5F] ml-0.5" fill="#1E3A5F" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 p-4 text-white">
                    <p className="text-xs text-white/70 mb-1">{ep.show}</p>
                    <h2 className="text-lg font-bold leading-snug mb-2">{ep.title}</h2>
                    <p className="text-sm text-white/80 mb-1">{ep.host}</p>
                    <p className="text-sm text-white/60">{ep.duration}</p>
                  </div>
                </>
              ) : (
                <div className="relative w-full h-full">
                  <img src={ep.image} alt={ep.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured Podcast Shows */}
      <div className="px-6 py-6 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-[#1E293B] mb-5">Featured Podcast Shows</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {PODCAST_SHOWS.map(show => (
            <div key={show.id} className="flex-shrink-0 w-44 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="relative w-full h-36">
                <img src={show.image} alt={show.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button className="w-10 h-10 rounded-full bg-[#0D9488]/90 flex items-center justify-center shadow">
                    <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm text-[#1E293B] leading-tight">{show.title}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{show.host}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{show.episodes} episodes</p>
                <button
                  onClick={() => toggleSubscribe(show.id)}
                  className={`mt-2.5 w-full py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    subscribedShows[show.id]
                      ? 'bg-[#0D9488] text-white border-[#0D9488]'
                      : 'border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488]/5'
                  }`}
                >
                  {subscribedShows[show.id] ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Episodes */}
      <div className="px-6 py-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-bold text-[#1E293B]">Latest Episodes</h2>
          <span className="text-lg font-semibold text-[#1E293B]">Categories Filter</span>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`pb-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'text-[#0D9488] border-b-2 border-[#0D9488]'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Episode List */}
        <div className="space-y-2">
          {filteredEpisodes.map(ep => (
            <div key={ep.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <img src={ep.image} alt={ep.ep} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1E293B] truncate">{ep.ep}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{ep.show}</p>
              </div>
              <span className="text-sm text-[#64748B] flex-shrink-0">{ep.duration}</span>
              <button className="w-9 h-9 rounded-full bg-[#0D9488] flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              </button>
              <div className="text-right flex-shrink-0 w-10">
                <p className="text-xs font-semibold text-[#64748B]">{ep.date.month}</p>
                <p className="text-sm font-bold text-[#1E293B]">{ep.date.day}</p>
              </div>
            </div>
          ))}
          {filteredEpisodes.length === 0 && (
            <p className="text-center py-10 text-sm text-[#64748B]">No episodes in this category yet.</p>
          )}
        </div>
      </div>

      {/* Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <img
            src={currentEpisode.image}
            alt={currentEpisode.title}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1E293B] truncate">
              {currentEpisode.show} - {currentEpisode.title.replace('Episode #42: ', '')}
            </p>
            <p className="text-xs text-[#64748B]">Sarah Jenkins</p>
            {/* Progress bar */}
            <div className="mt-1 h-1 bg-gray-200 rounded-full w-full">
              <div className="h-1 bg-[#0D9488] rounded-full" style={{ width: '35%' }} />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button className="text-[#64748B] hover:text-[#1E293B] transition-colors">
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              className="w-10 h-10 rounded-full bg-[#0D9488] flex items-center justify-center"
            >
              {playing
                ? <Pause className="w-4 h-4 text-white" fill="white" />
                : <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
              }
            </button>
            <button className="text-[#64748B] hover:text-[#1E293B] transition-colors">
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}