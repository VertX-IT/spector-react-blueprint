
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
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "h-2.5 w-2.5 rounded-full",
              isOnline ? "bg-green-500" : "bg-gray-400",
            )}>
              <span className="sr-only">{isOnline ? "Online" : "Offline"}</span>
              <div className={cn(
                "absolute inset-0 rounded-full",
                isOnline ? "animate-ping bg-green-500/75" : "animate-none",
              )} />
            </div>
            <span className={cn(
              "text-sm font-medium",
              isOnline ? "text-green-500" : "text-gray-400"
            )}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{isOnline ? "Online - Changes will sync automatically" : "Offline Mode - Changes will sync when connection is restored"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
