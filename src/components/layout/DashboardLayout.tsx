
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MobileNavBar } from '@/components/layout/MobileNavBar';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useMobile } from '@/contexts/MobileContext';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile } = useMobile();
  
  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <>
      {/* Desktop Layout */}
      {!isMobile && (
        <div className="h-screen flex overflow-hidden bg-muted/30">
          <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />
            
            <ScrollArea className="flex-1 overflow-auto">
              <main className={cn("flex-1 p-4 md:p-6")}>
                <Outlet />
              </main>
            </ScrollArea>
          </div>
        </div>
      )}
      
      {/* Mobile Layout */}
      {isMobile && (
        <MobileLayout className="has-bottom-tabs">
          <DashboardHeader 
            onSidebarToggle={() => setMobileMenuOpen(true)} 
          />
          
          <ScrollArea className="h-[calc(100vh-64px)] overflow-auto">
            <main className="p-4">
              <Outlet />
            </main>
          </ScrollArea>
          
          <MobileNavBar />
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="p-0 w-[80%] sm:w-[350px]">
              <DashboardSidebar isOpen={true} onToggle={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </MobileLayout>
      )}
    </>
  );
};
