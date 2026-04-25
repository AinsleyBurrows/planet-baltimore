import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MapPin, Calendar, Users, Palette, Landmark, Building2, BookOpen, MessageCircle, Bell, User, ChevronLeft, ChevronRight, Plus, Shield, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Map, label: 'City Map', path: '/map' },
  { icon: MapPin, label: 'Neighborhoods', path: '/neighborhoods' },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: Shield, label: 'Associations', path: '/community-associations' },
  { icon: Palette, label: 'Artists', path: '/artists' },
  { icon: Landmark, label: 'Arts Orgs', path: '/arts-organizations' },
  { icon: Building2, label: 'Businesses', path: '/businesses' },
  { icon: BookOpen, label: 'Your Story', path: '/stories' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-border px-4 ${collapsed ? 'justify-center' : ''}`}>
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
        <div className={`px-3 pt-4 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
          <Link to="/create-post">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full w-10 h-10">
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Create Post</TooltipContent>
              </Tooltip>
            ) : (
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg gap-2 h-11">
                <Plus className="w-5 h-5" />
                Create Post
              </Button>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link to={item.path} className={`flex items-center justify-center w-full h-11 rounded-lg transition-all ${isActive ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
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
                className={`flex items-center gap-3 px-3 h-11 rounded-lg transition-all duration-150 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${isActive ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-border p-3">
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="flex items-center justify-center w-full h-9 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}