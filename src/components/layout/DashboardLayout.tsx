
import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MobileNavBar } from '@/components/layout/MobileNavBar';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useMobile } from '@/contexts/MobileContext';

export const DashboardLayout: React.FC = () => {
  const { isMobile } = useMobile();
  
  return (
    <>
      {/* Desktop Layout */}
      {!isMobile && (
        <div className="h-screen flex overflow-hidden bg-muted/30">
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader />
            
            <ScrollArea className="flex-1 overflow-auto">
              <main className="flex-1 p-4 md:p-6 animate-fade-in">
                <Outlet />
              </main>
            </ScrollArea>
          </div>
        </div>
      )}
      
      {/* Mobile Layout */}
      {isMobile && (
        <MobileLayout className="has-bottom-tabs">
          <DashboardHeader />
          
          <ScrollArea className="h-[calc(100vh-64px-env(safe-area-inset-bottom,0px))] overflow-auto">
            <main className="p-3 sm:p-4 animate-fade-in pb-24 max-w-full"> {/* Ensure content fits on mobile */}
              <Outlet />
            </main>
          </ScrollArea>
          
          <MobileNavBar />
        </MobileLayout>
      )}
    </>
  );
};
