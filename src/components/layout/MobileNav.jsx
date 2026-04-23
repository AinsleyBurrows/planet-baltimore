import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Calendar, Plus, User, Map } from 'lucide-react';

const mobileItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Map, label: 'Map', path: '/map' },
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
              <Link key={item.path} to={item.path} className="flex items-center justify-center focus-visible:outline-none" aria-label="Create post">
                <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/25 transition-all duration-150 hover:scale-105 active:scale-95">
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
              className={`flex flex-col items-center gap-1 min-w-[56px] py-1 transition-all duration-150 active:scale-95 focus-visible:outline-none ${isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}