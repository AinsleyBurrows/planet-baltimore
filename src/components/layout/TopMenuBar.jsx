import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Compass, Calendar, MapPin, Users, Shield,
  Palette, Landmark, Building2, BookOpen, MessageCircle,
  Bell, User, Menu, Plus, Search, Ticket, Sparkles
} from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

const navItems = [
  { icon: Shield, label: 'Associations', path: '/community-associations' },
  { icon: Palette, label: 'Artists', path: '/artists' },
  { icon: Landmark, label: 'Arts Orgs', path: '/arts-organizations' },
  { icon: Building2, label: 'Businesses', path: '/businesses' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: Calendar, label: 'Community Calendar', path: '/community-calendar' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Ticket, label: 'Events', path: '/ticketing' },
  { icon: Sparkles, label: 'Festivals', path: '/festivals' },
  { icon: Home, label: 'Home', path: '/' },
  { icon: MapPin, label: 'Neighborhoods', path: '/neighborhoods' },
  { icon: BookOpen, label: 'Stories', path: '/stories' },
];

const utilItems = [
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function TopMenuBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadNotifications, unreadMessages } = useUnreadCounts();

  return (
    <header
      className="lg:hidden sticky top-0 z-[1000] bg-background/95 backdrop-blur-md border-b border-border"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
    >
      <div className="flex items-center justify-between px-4 py-3 min-h-[52px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5">
          <span className="text-lg font-bold" style={{ color: '#d4580a' }}>Planet</span>
          <span className="text-lg font-light text-foreground">Baltimore</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#d4580a]/15 text-[#d4580a] tracking-wide leading-none">BETA</span>
        </Link>

        <div className="flex items-center gap-1">
           {/* Quick-access icons — 44px minimum touch targets */}
           <Link to="/search" aria-label="Search" className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors active:bg-secondary ${location.pathname === '/search' ? 'text-accent' : 'text-muted-foreground'}`}>
             <Search className="w-5 h-5" />
           </Link>
           <Link to="/notifications" aria-label="Notifications" className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors active:bg-secondary ${location.pathname === '/notifications' ? 'text-accent' : 'text-muted-foreground'}`}>
             <Bell className="w-5 h-5" />
             {unreadNotifications > 0 && (
               <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: '#d4580a' }}>
                 {unreadNotifications > 99 ? '99+' : unreadNotifications}
               </span>
             )}
           </Link>
           <Link to="/messages" aria-label="Messages" className={`relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors active:bg-secondary ${location.pathname === '/messages' ? 'text-accent' : 'text-muted-foreground'}`}>
             <MessageCircle className="w-5 h-5" />
             {unreadMessages > 0 && (
               <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: '#d4580a' }}>
                 {unreadMessages > 99 ? '99+' : unreadMessages}
               </span>
             )}
           </Link>
           <ThemeToggle />
           {/* Hamburger menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Navigation menu" className="rounded-lg">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[1001]">
              {navItems.map(({ icon: Icon, label, path }) => {
                const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                return (
                  <DropdownMenuItem
                    key={path}
                    onSelect={() => navigate(path)}
                    className={`flex items-center gap-2 cursor-pointer ${isActive ? 'text-accent font-medium' : ''}`}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              {utilItems.map(({ icon: Icon, label, path }) => {
                const isActive = location.pathname === path;
                return (
                  <DropdownMenuItem
                    key={path}
                    onSelect={() => navigate(path)}
                    className={`flex items-center gap-2 cursor-pointer ${isActive ? 'text-accent font-medium' : ''}`}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {label}
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