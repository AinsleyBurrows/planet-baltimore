import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MapPin, Calendar, Users, Palette, Landmark, Building2, MessageCircle, Bell, User, ChevronLeft, ChevronRight, Plus, Shield, BookOpen, Search, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Palette, label: 'Artists', path: '/artists' },
  { icon: Landmark, label: 'Arts Orgs', path: '/arts-organizations' },
  { icon: Building2, label: 'Businesses', path: '/businesses' },
  { icon: Shield, label: 'Associations', path: '/community-associations' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Calendar, label: 'Community Calendar', path: '/community-calendar' },
  { icon: Ticket, label: 'Events', path: '/ticketing' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: MapPin, label: 'Neighborhoods', path: '/neighborhoods' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: BookOpen, label: 'Stories', path: '/stories' },
];

export default function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 ${collapsed ? 'w-[15%] min-w-[60px]' : 'w-[18%] min-w-[200px]'}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-border px-4 sm:px-5 ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? (
            <span className="text-xl font-bold text-accent">P</span>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-accent">Planet</span>
              <span className="text-xl font-light text-foreground">Baltimore</span>
            </Link>
          )}
        </div>

        {/* Create Button */}
        <div className={`px-3 pt-3 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
          <Link to="/create-post">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full aspect-square">
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Create Post</TooltipContent>
              </Tooltip>
            ) : (
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg py-2.5">
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
                    <Link to={item.path} className={`flex items-center justify-center w-full py-2 rounded-lg transition-all ${isActive ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${isActive ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-border p-2 sm:p-3">
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="flex items-center justify-center w-full py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}