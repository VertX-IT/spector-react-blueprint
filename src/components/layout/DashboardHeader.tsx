import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { NetworkStatus } from '@/components/ui/network-status';
import { useMobile } from '@/contexts/MobileContext';
import { Logo } from '@/components/ui/logo';
import { Link } from 'react-router-dom';

export const DashboardHeader: React.FC = () => {
  const { userData } = useAuth();
  const { isOnline } = useNetwork();
  const { isMobile } = useMobile();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4">
      <div className="flex items-center">
        <Link to="/">
          <Logo size="sm" iconOnly={true} />
        </Link>
      </div>
      
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <NetworkStatus isOnline={isOnline} />
        
        {!isMobile && (
          <Button variant="ghost" size="icon" className="rounded-full text-brand-navy">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        )}
        
        <Link to="/dashboard/profile" className="cursor-pointer">
          <Avatar className="h-8 w-8 border-2 border-brand-lightblue hover:opacity-80 transition-opacity">
            <AvatarImage src={userData?.profilePictureURL || ""} alt={userData?.displayName || "User"} />
            <AvatarFallback className="bg-brand-navy text-white">{userData?.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};
