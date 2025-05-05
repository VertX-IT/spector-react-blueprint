
import React from 'react';
import { useMobile } from '@/contexts/MobileContext';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ children, className }) => {
  const { isMobile } = useMobile();
  
  return (
    <div 
      className={cn(
        "mobile-container w-full h-full",
        isMobile && "pb-16", // Add padding bottom for mobile navigation
        className
      )}
    >
      {children}
    </div>
  );
};
