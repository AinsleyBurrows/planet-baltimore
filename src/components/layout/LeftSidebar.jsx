import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MapPin, Calendar, Users, Palette, Landmark, Building2, MessageCircle, Bell, User, ChevronLeft, ChevronRight, Plus, Shield, BookOpen, Search, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Shield, label: 'Associations', path: '/community-associations' },
  { icon: Palette, label: 'Artists', path: '/artists' },
  { icon: Landmark, label: 'Arts Orgs', path: '/arts-organizations' },
  { icon: Building2, label: 'Businesses', path: '/businesses' },
  { icon: Calendar, label: 'Calendar', path: '/community-calendar' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Ticket, label: 'Events', path: '/ticketing' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: MapPin, label: 'Neighborhoods', path: '/neighborhoods' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: BookOpen, label: 'Stories', path: '/stories' },
];

export default function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${collapsed ? 'w-[15%] min-w-[60px]' : 'w-[18%] min-w-[200px]'}`} style={{background: 'linear-gradient(180deg, #8B0032 0%, #6B0060 40%, #4400CC 100%)'}}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-white/10 px-4 sm:px-5 ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? (
            <span className="text-xl font-bold text-white">P</span>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-white">Planet</span>
              <span className="text-xl font-light text-white/80">Baltimore</span>
            </Link>
          )}
        </div>

        {/* Create Button */}
        <div className={`px-3 pt-3 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
          <Link to="/create-post">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" className="bg-white/20 hover:bg-white/30 text-white rounded-full aspect-square border border-white/30">
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Create Post</TooltipContent>
              </Tooltip>
            ) : (
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-lg py-2.5 font-semibold backdrop-blur-sm">
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link to={item.path} className={`flex items-center justify-center w-full py-2 rounded-lg transition-all ${isActive ? 'bg-white/25 text-white' : 'text-white/70 hover:bg-white/15 hover:text-white'}`}>
                      <Icon className="w-5 h-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98] ${isActive ? 'bg-white/25 text-white' : 'text-white/70 hover:bg-white/15 hover:text-white'}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-white/10 p-2 sm:p-3">
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="flex items-center justify-center w-full py-2 rounded-lg text-white/60 hover:bg-white/15 hover:text-white active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}