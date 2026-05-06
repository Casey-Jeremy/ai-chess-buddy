import React, { createContext, useContext, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface NetworkContextType {
  isOnline: boolean;
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isOffline: false,
});

export function useNetwork() {
  return useContext(NetworkContext);
}

interface NetworkProviderProps {
  children: React.ReactNode;
}

/**
 * Provider that monitors network status and triggers background refresh when coming online
 * Requirements: 6.3 - Implement background refresh when coming online
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const { isOnline, isOffline } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    // When coming back online, refetch all active queries in the background
    if (isOnline) {
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      });
    }
  }, [isOnline, queryClient]);

  return (
    <NetworkContext.Provider value={{ isOnline, isOffline }}>
      {children}
    </NetworkContext.Provider>
  );
}
