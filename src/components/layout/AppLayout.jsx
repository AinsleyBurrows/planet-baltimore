import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import TopMenuBar from './TopMenuBar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background" style={{ minHeight: '100dvh' }}>
      <LeftSidebar />
      <RightSidebar />
      <div className="lg:ml-[18%] lg:mr-[19%] min-h-[100dvh] flex flex-col">
        <div className="lg:hidden">
          <TopMenuBar />
        </div>
        <main className="flex-1 w-full">
          {/* 
            px-4 on mobile for comfortable reading margins (matches iOS/Android HIG)
            pb-[calc(5rem+env(safe-area-inset-bottom))] ensures content clears bottom nav + home indicator
          */}
          <div className="max-w-4xl mx-auto px-4 sm:px-5 lg:px-0 py-4 sm:py-6 lg:py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}