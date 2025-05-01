
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, User, Settings, LogOut, Plus, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/ui/logo';

interface DashboardSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onToggle }) => {
  const { userData, logOut } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname.startsWith(path);

  const MenuLink: React.FC<{
    to: string;
    icon: React.ReactNode;
    label: string;
  }> = ({ to, icon, label }) => (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )
      }
    >
      {icon}
      {isOpen && <span>{label}</span>}
    </NavLink>
  );

  return (
    <div className={cn(
      "border-r bg-card transition-all duration-300 ease-in-out relative",
      isOpen ? "w-64" : "w-16",
    )}>
      <div className="flex h-16 items-center border-b px-4">
        <div className={cn(
          "flex items-center", 
          isOpen ? "justify-between w-full" : "justify-center"
        )}>
          {isOpen && <Logo size="sm" />}
          <Button variant="ghost" size="icon" onClick={onToggle}>
            {isOpen ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            {userData?.role === 'designer' && (
              <>
                <MenuLink 
                  to="/dashboard/new-project" 
                  icon={<Plus className="h-5 w-5 text-primary" />} 
                  label="New Project" 
                />
                <MenuLink 
                  to="/dashboard/my-projects" 
                  icon={<FolderOpen className="h-5 w-5" />} 
                  label="My Projects" 
                />
                <MenuLink 
                  to="/dashboard/join-project" 
                  icon={<Plus className="h-5 w-5" />} 
                  label="Join Project" 
                />
              </>
            )}
            
            {userData?.role === 'collector' && (
              <>
                <MenuLink 
                  to="/dashboard/my-projects" 
                  icon={<FolderOpen className="h-5 w-5" />} 
                  label="My Projects" 
                />
                <MenuLink 
                  to="/dashboard/join-project" 
                  icon={<Plus className="h-5 w-5" />} 
                  label="Join Project" 
                />
              </>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-1">
            <MenuLink 
              to="/dashboard/profile" 
              icon={<User className="h-5 w-5" />} 
              label="Profile" 
            />
            <MenuLink 
              to="/dashboard/settings" 
              icon={<Settings className="h-5 w-5" />} 
              label="Settings" 
            />
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm justify-start",
                "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => logOut()}
            >
              <LogOut className="h-5 w-5" />
              {isOpen && <span>Log Out</span>}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
