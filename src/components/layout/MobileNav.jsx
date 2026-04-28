import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, User, BookOpen } from 'lucide-react';

const mobileItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Plus, label: 'Create', path: '/create-post', isCreate: true },
  { icon: BookOpen, label: 'Stories', path: '/stories' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="hidden sm:block lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around py-2 sm:py-3 px-1">
        {mobileItems.map((item) => {
          const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          const Icon = item.icon;

          if (item.isCreate) {
            return (
              <Link key={item.path} to={item.path} className="flex items-center justify-center focus-visible:outline-none" aria-label="Create post">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/25 transition-all duration-150 hover:scale-105 active:scale-95">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent-foreground" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.label}
              className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 py-1.5 transition-all duration-150 active:scale-95 focus-visible:outline-none ${isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] sm:text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}