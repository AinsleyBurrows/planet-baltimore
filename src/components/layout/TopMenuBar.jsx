import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Compass, Map, MapPin, Calendar, Users, Shield,
  Palette, Landmark, Building2, BookOpen, MessageCircle,
  Bell, User, Menu, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

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
];

const utilItems = [
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function TopMenuBar() {
  const location = useLocation();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-accent">Planet</span>
          <span className="text-lg font-light text-foreground">Baltimore</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Hamburger menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Navigation menu" className="rounded-lg">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {navItems.map(({ icon: Icon, label, path }) => {
                const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                return (
                  <DropdownMenuItem key={path} asChild>
                    <Link to={path} className={`flex items-center gap-2 cursor-pointer ${isActive ? 'text-accent font-medium' : ''}`}>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              {utilItems.map(({ icon: Icon, label, path }) => {
                const isActive = location.pathname === path;
                return (
                  <DropdownMenuItem key={path} asChild>
                    <Link to={path} className={`flex items-center gap-2 cursor-pointer ${isActive ? 'text-accent font-medium' : ''}`}>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}