import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Hook to detect network connectivity status
 * 
 * Returns:
 * - isOnline: Current connection state
 * - wasOffline: True when transitioning from offline to online (for sync operations)
 */
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;

      // Detect transition from offline to online
      if (!isOnline && online) {
        setWasOffline(true);
        
        // Reset wasOffline flag after a short delay
        // This gives components time to react to the transition
        setTimeout(() => {
          setWasOffline(false);
        }, 1000);
      }

      setIsOnline(online);
    });

    // Get initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  return {
    isOnline,
    wasOffline,
  };
};

/**
 * Hook to trigger sync operations when coming back online
 * 
 * @param onSync - Callback function to execute when transitioning from offline to online
 */
export const useOfflineSync = (onSync: () => void | Promise<void>) => {
  const { isOnline, wasOffline } = useOffline();

  useEffect(() => {
    if (wasOffline && isOnline) {
      // Execute sync callback
      const result = onSync();
      
      // Handle async callbacks
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error('Error during offline sync:', error);
        });
      }
    }
  }, [wasOffline, isOnline, onSync]);

  return { isOnline, wasOffline };
};
