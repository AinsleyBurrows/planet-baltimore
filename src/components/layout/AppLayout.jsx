import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import TopMenuBar from './TopMenuBar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <LeftSidebar />
      <RightSidebar />
      <div className="lg:ml-[18%] lg:mr-[19%] min-h-[100dvh] flex flex-col">
        <div className="lg:hidden">
          <TopMenuBar />
        </div>
        <main className="flex-1 w-full">
          {/* pb-20 ensures content isn't hidden behind the mobile bottom nav */}
          <div className="max-w-4xl mx-auto px-[5px] sm:px-0 py-4 sm:py-6 lg:py-8 pb-24 lg:pb-8">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Bottom nav visible on all mobile/tablet sizes below lg */}
      <MobileNav />
    </div>
  );
}