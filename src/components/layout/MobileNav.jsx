import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Calendar, Plus, Bell, User } from 'lucide-react';

const mobileItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Plus, label: 'Create', path: '/create-post', isCreate: true },
  { icon: Calendar, label: 'Events', path: '/events' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <Link key={item.path} to={item.path} className="flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/25">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-colors ${isActive ? 'text-accent' : 'text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}