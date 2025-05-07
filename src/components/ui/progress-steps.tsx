
import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ 
  currentStep, 
  totalSteps, 
  labels
}) => {
  const progress = Math.floor((currentStep / totalSteps) * 100);
  
  return (
    <div className="w-full space-y-2 mb-6">
      <Progress value={progress} className="h-2 bg-gray-200" />
      
      <div className="flex justify-between">
        {labels.map((label, index) => {
          const isCompleted = index + 1 <= currentStep;
          const isCurrent = index + 1 === currentStep;
          
          return (
            <div 
              key={index} 
              className={cn(
                "flex flex-col items-center relative",
                isCompleted ? "text-brand-green" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                isCompleted ? "bg-brand-green text-white" : "bg-muted border",
                isCurrent ? "ring-2 ring-brand-green ring-offset-2" : ""
              )}>
                {index + 1}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                isCompleted ? "text-brand-green" : "text-muted-foreground",
                isCurrent ? "font-semibold" : ""
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
