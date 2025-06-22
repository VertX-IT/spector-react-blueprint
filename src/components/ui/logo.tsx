import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconOnly?: boolean;
  showAppName?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  className, 
  iconOnly = false,
  showAppName = true
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Icon Logo (conditionally shown) */}
      {!iconOnly && (
        <div className={cn(
          "flex items-center justify-center",
          size === 'sm' && "w-8 h-8",
          size === 'md' && "w-10 h-10",
          size === 'lg' && "w-12 h-12",
        )}>
          <img 
            src="/lovable-uploads/f72ff0c9-f713-436c-a88a-f9138dd1a98d.png" 
            alt="SPECTOR logo icon" 
            className={cn(
              "object-contain",
              size === 'sm' && "w-6 h-6",
              size === 'md' && "w-8 h-8",
              size === 'lg' && "w-10 h-10",
            )}
          />
        </div>
      )}

      {/* Text Logo (conditionally shown) */}
      {showAppName && (
        <img 
          src="/lovable-uploads/22148018-39eb-4c9f-b829-858c04b59724.png" 
          alt="SPECTOR" 
          className={cn(
            "h-auto",
            size === 'sm' && "h-5",
            size === 'md' && "h-6",
            size === 'lg' && "h-8",
          )}
        />
      )}
    </div>
  );
};
