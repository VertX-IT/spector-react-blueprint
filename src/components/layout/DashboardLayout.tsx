
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
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
  );
};
