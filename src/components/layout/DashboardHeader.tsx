
import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { NetworkStatus } from '@/components/ui/network-status';

interface DashboardHeaderProps {
  onSidebarToggle: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onSidebarToggle }) => {
  const { userData } = useAuth();
  const { isOnline } = useNetwork();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onSidebarToggle}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <NetworkStatus isOnline={isOnline} />
        
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt={userData?.displayName || "User"} />
          <AvatarFallback>{userData?.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
