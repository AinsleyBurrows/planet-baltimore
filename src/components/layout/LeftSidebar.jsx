import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MapPin, Calendar, Users, Palette, Landmark, Building2, MessageCircle, Bell, User, ChevronLeft, ChevronRight, Plus, Shield, BookOpen, Search, Ticket, LogOut, LogIn, Flag, Video, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { base44 } from '@/api/base44Client';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Palette, label: 'Artists', path: '/artists' },
  { icon: Landmark, label: 'Arts Orgs', path: '/arts-organizations' },
  { icon: Building2, label: 'Businesses', path: '/businesses' },
  { icon: Calendar, label: 'Calendar', path: '/community-calendar' },
  { icon: Shield, label: 'Community Associations', path: '/community-associations' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Ticket, label: 'Events', path: '/ticketing' },
  { icon: Users, label: 'Groups/Communities', path: '/communities' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: MapPin, label: 'Neighborhoods', path: '/neighborhoods' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: BookOpen, label: 'Stories', path: '/stories' },
  { icon: Video, label: 'Videos', path: '/videos' },
  { icon: Trophy, label: 'Baltimore 100', path: '/leaderboard' },
];

export default function LeftSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { unreadNotifications, unreadMessages } = useUnreadCounts();
  const { user } = useCurrentUser();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 ${collapsed ? 'w-[15%] min-w-[60px]' : 'w-[18%] min-w-[200px]'}`}>
        {/* Logo */}
        <div className={`flex items-center h-16 border-b border-border px-4 sm:px-5 ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? (
            <span className="text-xl font-bold" style={{ color: '#d4580a' }}>P</span>
          ) : (
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: '#d4580a' }}>Planet</span>
              <span className="text-xl font-light text-foreground">Baltimore</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#d4580a]/15 text-[#d4580a] tracking-wide leading-none">BETA</span>
            </Link>
          )}
        </div>

        {/* Create Button */}
        <div className={`px-3 pt-3 pb-2 ${collapsed ? 'flex justify-center' : ''}`}>
          <Link to="/create-post">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" className="rounded-full aspect-square" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Create Post</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="outline" className="w-full rounded-lg py-2.5 hover:bg-secondary/80" style={{ borderColor: '#d4580a', color: '#d4580a' }}>
                Create Post
              </Button>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;

            const badge = item.path === '/notifications' ? unreadNotifications : item.path === '/messages' ? unreadMessages : 0;

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link to={item.path} className={`relative flex items-center justify-center w-full py-2 rounded-lg transition-all ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                      <Icon className="w-5 h-5" />
                      {badge > 0 && (
                        <span className="absolute top-0.5 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: '#d4580a' }}>
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${isActive ? 'bg-muted text-foreground font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-150 ${isActive ? 'scale-110 text-foreground' : ''}`} />
                <span className="truncate flex-1">{item.label}</span>
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#d4580a' }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Reports link */}
        {user?.role === 'admin' && (
          <div className={`px-2 sm:px-3 py-1 border-t border-border ${collapsed ? 'flex justify-center' : ''}`}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/admin/reports" className="flex items-center justify-center w-full py-2 rounded-lg transition-all text-destructive hover:bg-destructive/10">
                    <Flag className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Content Reports</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                to="/admin/reports"
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Flag className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Content Reports</span>
              </Link>
            )}
          </div>
        )}

        {/* Auth Links */}
        <div className="border-t border-border p-2 sm:p-3 space-y-0.5">
          {user ? (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => base44.auth.logout()}
                    className="flex items-center justify-center w-full py-2 rounded-lg transition-all text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => base44.auth.logout()}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] w-full"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Logout</span>
              </button>
            )
          ) : (
            collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="flex items-center justify-center w-full py-2 rounded-lg transition-all text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <LogIn className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Login</TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] w-full"
              >
                <LogIn className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Login</span>
              </button>
            )
          )}
        </div>

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