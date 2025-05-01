
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  icon,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground max-w-md">{description}</p>
      {buttonText && buttonLink && (
        <Button className="mt-6" onClick={() => navigate(buttonLink)}>
          {buttonText}
        </Button>
      )}
    </div>
  );
};
