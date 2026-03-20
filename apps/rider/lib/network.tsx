import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type NetworkContextType = {
  isOnline: boolean;
  lastOnlineAt: number | null;
};

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  lastOnlineAt: null,
});

/**
 * Lightweight network detection using fetch probe.
 * Avoids @react-native-community/netinfo dependency.
 * Checks connectivity on mount, on app foreground, and every 15s.
 */
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(Date.now());

  const checkConnectivity = useCallback(async () => {
    try {
      // Tiny HEAD request to Convex health endpoint or Google DNS
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      setIsOnline(true);
      setLastOnlineAt(Date.now());
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    checkConnectivity();

    // Re-check on app foreground
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') checkConnectivity();
    };
    const sub = AppState.addEventListener('change', handleAppState);

    // Periodic check every 15s
    const interval = setInterval(checkConnectivity, 15000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [checkConnectivity]);

  return (
    <NetworkContext.Provider value={{ isOnline, lastOnlineAt }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
