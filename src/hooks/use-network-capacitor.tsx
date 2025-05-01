
import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

type NetworkStatus = {
  connected: boolean;
  connectionType: string;
};

export function useNetworkCapacitor() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const checkNetworkStatus = async () => {
      const status = await Network.getStatus();
      setNetworkStatus(status);
    };

    // Initial check
    checkNetworkStatus();

    // Listen for network status changes
    const networkListener = Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status);
      setNetworkStatus(status);
    });

    return () => {
      networkListener.remove();
    };
  }, []);

  return networkStatus;
}
