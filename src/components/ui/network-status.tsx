
import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NetworkStatusProps {
  isOnline: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ isOnline }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="relative flex items-center">
            <div className={cn(
              "h-3 w-3 rounded-full",
              isOnline ? "bg-green-500" : "bg-red-500",
            )}>
              <span className="sr-only">{isOnline ? "Online" : "Offline"}</span>
              <div className={cn(
                "absolute inset-0 rounded-full",
                isOnline ? "animate-ping bg-green-500/75" : "animate-none",
              )} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isOnline ? "Online - Changes will sync automatically" : "Offline Mode - Changes will sync when connection is restored"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
