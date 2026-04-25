import React from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <RightSidebar />
      <div className="ml-[15%] min-w-[60px] lg:ml-[18%] mr-[19%] min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}