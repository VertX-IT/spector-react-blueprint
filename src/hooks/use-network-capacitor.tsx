
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
    let listenerHandle: { remove: () => void } | null = null;
    let isMounted = true;

    const setupListener = async () => {
      const handle = await Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed:', status);
        if (isMounted) {
          setNetworkStatus(status);
        }
      });
      listenerHandle = handle;
    };

    setupListener();

    return () => {
      isMounted = false;
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  return networkStatus;
}
