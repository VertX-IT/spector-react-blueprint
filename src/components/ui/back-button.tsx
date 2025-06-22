import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileBackButton } from '@/hooks/use-mobile-back-button';

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
  icon?: 'arrow' | 'chevron';
  enableMobileBack?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  to,
  onClick,
  variant = 'ghost',
  size = 'sm',
  className,
  showText = false,
  icon = 'arrow',
  enableMobileBack = true
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  // Enable mobile back button functionality
  useMobileBackButton({
    onBack: enableMobileBack ? handleBack : undefined,
    fallbackPath: enableMobileBack ? to : undefined,
    enabled: enableMobileBack
  });

  const IconComponent = icon === 'arrow' ? ArrowLeft : ChevronLeft;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn(
        "flex items-center gap-1 transition-all duration-200",
        className
      )}
    >
      <IconComponent className="h-4 w-4" />
      {showText && <span>Back</span>}
    </Button>
  );
}; 