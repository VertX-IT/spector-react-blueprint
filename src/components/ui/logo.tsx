
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', className }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "bg-primary/80 text-primary-foreground rounded-lg flex items-center justify-center font-bold",
        size === 'sm' && "w-8 h-8 text-lg",
        size === 'md' && "w-10 h-10 text-xl",
        size === 'lg' && "w-12 h-12 text-2xl",
      )}>
        S
      </div>
      <div className="font-bold">
        <span className="text-primary">Survey</span>
        <span className="text-foreground">Sync</span>
      </div>
    </div>
  );
};
