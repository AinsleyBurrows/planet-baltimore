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
      <div className="lg:ml-[260px] xl:mr-[280px] min-h-screen flex flex-col">
        <TopMenuBar />
        <main className="flex-1 pb-20 lg:pb-0">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}