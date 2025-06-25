import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseBackNavigationOptions {
  onBack?: () => void;
  fallbackPath?: string;
  preventDefault?: boolean;
}

export const useBackNavigation = (options: UseBackNavigationOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { onBack, fallbackPath, preventDefault = false } = options;

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
    const handlePopState = (event: PopStateEvent) => {
      if (preventDefault) {
        event.preventDefault();
        handleBack();
      }
    };

    // Handle browser back button
    window.addEventListener('popstate', handlePopState);

    // Handle mobile back button (if available)
    if ('navigation' in window) {
      // @ts-ignore - Navigation API is experimental
      window.navigation?.addEventListener('navigate', (event: any) => {
        if (event.navigationType === 'back') {
          event.preventDefault();
          handleBack();
        }
      });
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if ('navigation' in window) {
        // @ts-ignore
        window.navigation?.removeEventListener('navigate', handlePopState);
      }
    };
  }, [handleBack, preventDefault]);

  return { handleBack };
}; 