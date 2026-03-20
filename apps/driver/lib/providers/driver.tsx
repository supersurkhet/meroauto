import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppState } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { API } from '../api';
import * as Location from 'expo-location';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from '../background-location';

type DriverStatus = 'offline' | 'available' | 'busy' | 'on_ride';

type DriverProfile = {
  _id: any;
  status: DriverStatus;
  isApproved: boolean;
  isSuspended: boolean;
  rating: number;
  totalRides: number;
  totalEarnings: number;
  currentVehicleId?: any;
};

type PendingRequest = {
  _id: any;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  estimatedFare: number;
  estimatedDistance: number;
  estimatedDuration: number;
  paymentMethod: string;
  createdAt: number;
  expiresAt: number;
};

type ActiveRide = {
  _id: any;
  riderId: any;
  pickup: { lat: number; lng: number; address: string };
  dropoff: { lat: number; lng: number; address: string };
  status: string;
  otp?: string;
  fare: number;
  distance: number;
  startedAt?: number;
  isQrRide?: boolean;
};

type DriverContextType = {
  profile: DriverProfile | null | undefined;
  isOnline: boolean;
  toggleStatus: () => Promise<void>;
  pendingRequests: PendingRequest[];
  activeRide: ActiveRide | null;
  acceptRide: (requestId: any) => Promise<any>;
  rejectRide: (requestId: any) => Promise<void>;
  startRide: (rideId: any, otp: string) => Promise<void>;
  completeRide: (rideId: any) => Promise<void>;
  cancelRide: (rideId: any, reason?: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const DriverContext = createContext<DriverContextType>({
  profile: null,
  isOnline: false,
  toggleStatus: async () => {},
  pendingRequests: [],
  activeRide: null,
  acceptRide: async () => {},
  rejectRide: async () => {},
  startRide: async () => {},
  completeRide: async () => {},
  cancelRide: async () => {},
  isLoading: true,
  error: null,
});

export function DriverProvider({ children }: { children: ReactNode }) {
  const [locationSub, setLocationSub] = useState<Location.LocationSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real-time Convex subscriptions
  const profile = useQuery(API.drivers.myProfile) as DriverProfile | null | undefined;
  const pendingRequests = (useQuery(API.matching.myPendingRequests) ?? []) as PendingRequest[];
  const activeRide = (useQuery(API.rides.myActiveRide) ?? null) as ActiveRide | null;

  // Convex mutations
  const updateStatusMut = useMutation(API.drivers.updateStatus);
  const updateLocationMut = useMutation(API.locations.updateDriverLocation);
  const acceptRequestMut = useMutation(API.rides.acceptRequest);
  const rejectRequestMut = useMutation(API.rides.rejectRequest);
  const startRideMut = useMutation(API.rides.startRide);
  const completeRideMut = useMutation(API.rides.completeRide);
  const cancelRideMut = useMutation(API.rides.cancelRide);

  const isOnline =
    profile?.status === 'available' ||
    profile?.status === 'busy' ||
    profile?.status === 'on_ride';

  // Foreground location tracking
  useEffect(() => {
    if (!isOnline) {
      if (locationSub) {
        locationSub.remove();
        setLocationSub(null);
      }
      stopBackgroundLocationTracking().catch(() => {});
      return;
    }

    let sub: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission required to go online');
        return;
      }

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          updateLocationMut({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            heading: loc.coords.heading ?? undefined,
            speed: loc.coords.speed ?? undefined,
          }).catch(() => {});
        },
      );
      setLocationSub(sub);

      // Also start background tracking
      startBackgroundLocationTracking().catch(() => {});
    })();

    return () => {
      sub?.remove();
    };
  }, [isOnline]);

  // Re-sync location when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isOnline && !locationSub) {
        Location.requestForegroundPermissionsAsync().then(({ status }) => {
          if (status !== 'granted') return;
          Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (loc) => {
              updateLocationMut({
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                heading: loc.coords.heading ?? undefined,
                speed: loc.coords.speed ?? undefined,
              }).catch(() => {});
            },
          ).then(setLocationSub);
        });
      }
    });

    return () => subscription.remove();
  }, [isOnline, locationSub]);

  const toggleStatus = useCallback(async () => {
    setError(null);
    try {
      await updateStatusMut({ status: isOnline ? 'offline' : 'available' });
    } catch (e: any) {
      setError(e.message ?? 'Failed to update status');
    }
  }, [isOnline, updateStatusMut]);

  const acceptRide = useCallback(
    async (requestId: any) => {
      setError(null);
      try {
        return await acceptRequestMut({ requestId });
      } catch (e: any) {
        setError(e.message ?? 'Failed to accept ride');
        throw e;
      }
    },
    [acceptRequestMut],
  );

  const rejectRide = useCallback(
    async (requestId: any) => {
      try {
        await rejectRequestMut({ requestId });
      } catch (e: any) {
        setError(e.message ?? 'Failed to reject ride');
      }
    },
    [rejectRequestMut],
  );

  const startRide = useCallback(
    async (rideId: any, otp: string) => {
      try {
        await startRideMut({ rideId, otp });
      } catch (e: any) {
        throw e; // Let the UI handle OTP errors
      }
    },
    [startRideMut],
  );

  const completeRide = useCallback(
    async (rideId: any) => {
      try {
        await completeRideMut({ rideId });
      } catch (e: any) {
        setError(e.message ?? 'Failed to complete ride');
        throw e;
      }
    },
    [completeRideMut],
  );

  const cancelRide = useCallback(
    async (rideId: any, reason?: string) => {
      try {
        await cancelRideMut({ rideId, reason });
      } catch (e: any) {
        setError(e.message ?? 'Failed to cancel ride');
      }
    },
    [cancelRideMut],
  );

  return (
    <DriverContext.Provider
      value={{
        profile,
        isOnline,
        toggleStatus,
        pendingRequests,
        activeRide,
        acceptRide,
        rejectRide,
        startRide,
        completeRide,
        cancelRide,
        isLoading: profile === undefined,
        error,
      }}
    >
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  return useContext(DriverContext);
}
