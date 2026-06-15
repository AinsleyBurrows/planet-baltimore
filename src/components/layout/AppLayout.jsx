import React, { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import TopMenuBar from './TopMenuBar';
import MobileNav from './MobileNav';

// Context so LeftSidebar can broadcast its collapsed state to AppLayout
export const SidebarContext = createContext({ collapsed: false, setCollapsed: () => {} });
export const useSidebar = () => useContext(SidebarContext);

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background" style={{ minHeight: '100dvh' }}>
        <LeftSidebar />
        <RightSidebar />
        {/* Left margin tracks sidebar width; right margin only on xl where RightSidebar appears */}
        <div
          className={`min-h-[100dvh] flex flex-col transition-all duration-300 xl:mr-[19%] ${collapsed ? 'lg:ml-[15%]' : 'lg:ml-[18%]'}`}
        >
          <div className="lg:hidden">
            <TopMenuBar />
          </div>
          <main className="flex-1 w-full">
            <div className="max-w-4xl mx-auto px-4 sm:px-5 lg:px-0 py-4 sm:py-6 lg:py-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </SidebarContext.Provider>
  );
}