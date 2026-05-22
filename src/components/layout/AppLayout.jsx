import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import TopMenuBar from './TopMenuBar';
import MobileNav from './MobileNav';
import { X } from 'lucide-react';

export default function AppLayout() {
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('beta_banner_dismissed') === 'true'
  );

  const dismissBanner = () => {
    sessionStorage.setItem('beta_banner_dismissed', 'true');
    setBannerDismissed(true);
  };

  return (
    <div className="min-h-screen bg-background" style={{ minHeight: '100dvh' }}>
      {/* BETA Banner */}
      {!bannerDismissed && (
        <div className="fixed top-0 left-0 right-0 z-[2000] flex items-center justify-center gap-3 px-4 py-2 text-sm font-medium bg-amber-50 border-b border-amber-200 text-amber-800">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-400 tracking-wide">BETA</span>
          You're using an early beta version of Planet Baltimore — thanks for being here! Things may change.
          <button onClick={dismissBanner} className="ml-auto p-1 rounded-full hover:bg-amber-100 transition-colors" aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <LeftSidebar />
      <RightSidebar />
      <div className={`lg:ml-[18%] lg:mr-[19%] min-h-[100dvh] flex flex-col ${!bannerDismissed ? 'pt-[38px]' : ''}`}>
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