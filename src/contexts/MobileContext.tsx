
import React, { createContext, useContext } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileContextProps {
  isMobile: boolean;
}

const MobileContext = createContext<MobileContextProps | undefined>(undefined);

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobile = (): MobileContextProps => {
  const context = useContext(MobileContext);
  
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  
  return context;
};
