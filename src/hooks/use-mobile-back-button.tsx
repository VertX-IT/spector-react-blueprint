import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobile } from '@/contexts/MobileContext';

interface UseMobileBackButtonOptions {
  onBack?: () => void;
  fallbackPath?: string;
  enabled?: boolean;
}

export const useMobileBackButton = (options: UseMobileBackButtonOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useMobile();
  const { onBack, fallbackPath, enabled = true } = options;

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      navigate(-1);
    }
  }, [onBack, fallbackPath, navigate]);

  useEffect(() => {
    if (!isMobile || !enabled) return;

    // Handle browser back button and mobile back button
    const handlePopState = (event: PopStateEvent) => {
      // For mobile, we want to handle the back button ourselves
      if (isMobile) {
        event.preventDefault();
        handleBack();
      }
    };

    // Listen for popstate events (triggered by back button)
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isMobile, enabled, handleBack]);

  return { handleBack };
}; 