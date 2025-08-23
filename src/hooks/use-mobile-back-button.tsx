import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
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
    if (!enabled) return;

    const handlePopState = (event: PopStateEvent) => {
      // For non-mobile, we handle the browser back button normally
      if (!isMobile) {
        handleBack();
      }
    };

    // Handle Capacitor's native back button
    let removeListener: (() => void) | undefined;
    if (isMobile) {
      removeListener = App.addListener('backButton', (event) => {
        event.preventDefault();
        handleBack();
      }).remove;
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (removeListener) {
        removeListener();
      }
    };
  }, [isMobile, enabled, handleBack]);

  return { handleBack };
}; 