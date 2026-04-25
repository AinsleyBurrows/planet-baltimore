import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import TopMenuBar from './TopMenuBar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <RightSidebar />
      <div className="lg:ml-[18%] lg:mr-[19%] min-h-screen flex flex-col">
        <div className="lg:hidden">
          <TopMenuBar />
        </div>
        <main className="flex-1 w-full">
          <div className="max-w-4xl mx-auto px-[5px] sm:px-0 py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}