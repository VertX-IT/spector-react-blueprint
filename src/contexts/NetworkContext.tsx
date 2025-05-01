
import React, { createContext, useContext, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNetworkCapacitor } from '@/hooks/use-network-capacitor';

interface NetworkContextType {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected: isOnline } = useNetworkCapacitor();
  const { toast } = useToast();

  useEffect(() => {
    if (isOnline) {
      toast({
        title: "Back online!",
        description: "Your data will now synchronize with the server.",
      });
    } else {
      toast({
        title: "You're offline",
        description: "Don't worry, your data is saved locally and will sync when you're back online.",
        variant: "destructive",
      });
    }
  }, [isOnline, toast]);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};
