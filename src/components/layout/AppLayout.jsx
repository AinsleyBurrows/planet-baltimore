import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import MobileNav from './MobileNav';
import TopMenuBar from './TopMenuBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <RightSidebar />
      <div className="lg:ml-[18%] xl:mr-[19%] min-h-screen flex flex-col">
        <TopMenuBar />
        <main className="flex-1 pb-[20vh] lg:pb-0" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}>
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}