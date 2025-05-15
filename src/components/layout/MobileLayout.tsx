
import React from 'react';
import { useMobile } from '@/contexts/MobileContext';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  noBottomPadding?: boolean;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  className,
  noBottomPadding = false
}) => {
  const { isMobile } = useMobile();
  
  return (
    <div 
      className={cn(
        "mobile-container w-full h-full",
        isMobile && !noBottomPadding && "pb-[calc(64px+env(safe-area-inset-bottom,0px))]", // Add padding bottom for mobile navigation
        className
      )}
      style={{ maxWidth: '100%', overflowX: 'hidden' }} // Ensure content doesn't overflow on mobile
    >
      {children}
    </div>
  );
};
