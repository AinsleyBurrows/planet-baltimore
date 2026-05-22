import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, Bell, User, Menu, MessageCircle, Compass, BookOpen, Users, Shield, Palette, Landmark, Building2, MapPin, Calendar, Ticket } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const primaryItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Plus, label: 'Create', path: '/create-post', isCreate: true },
  { icon: Bell, label: 'Alerts', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const moreItems = [
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: BookOpen, label: 'Stories', path: '/stories' },
  { icon: Ticket, label: 'Events', path: '/ticketing' },
  { icon: Calendar, label: 'Calendar', path: '/community-calendar' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: Shield, label: 'Associations', path: '/community-associations' },
  { icon: Palette, label: 'Artists', path: '/artists' },
  { icon: Landmark, label: 'Arts Orgs', path: '/arts-organizations' },
  { icon: Building2, label: 'Businesses', path: '/businesses' },
  { icon: MapPin, label: 'Neighborhoods', path: '/neighborhoods' },
];

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="flex items-center justify-around py-1.5 px-2">
        {primaryItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <Link key={item.path} to={item.path} className="flex items-center justify-center focus-visible:outline-none min-w-[44px] min-h-[44px]" aria-label="Create post">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/25 active:scale-95 transition-transform duration-150">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-1 py-1 transition-all duration-150 active:scale-95 focus-visible:outline-none rounded-xl ${isActive ? 'text-accent' : 'text-muted-foreground'}`}
            >
              <Icon className={`w-[22px] h-[22px] transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* "More" dropdown for all remaining pages */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-1 py-1 text-muted-foreground transition-colors focus-visible:outline-none active:scale-95 rounded-xl">
            <Menu className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-medium leading-none">More</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52 mb-1 z-[1001]">
            {moreItems.map(({ icon: Icon, label, path }) => {
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}