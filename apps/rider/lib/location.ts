import * as Location from 'expo-location';
import { useState, useEffect } from 'react';

export type LatLng = {
  latitude: number;
  longitude: number;
};

// Default: Surkhet, Nepal
export const DEFAULT_LOCATION: LatLng = {
  latitude: 28.6000,
  longitude: 81.6167,
};

export function useLocation() {
  const [location, setLocation] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          setLocation(DEFAULT_LOCATION);
          setIsLoading(false);
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
        setIsLoading(false);

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          (loc) => {
            setLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        );
      } catch (err) {
        setError('Failed to get location');
        setLocation(DEFAULT_LOCATION);
        setIsLoading(false);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, []);

  return { location, error, isLoading };
}

export function calculateDistance(from: LatLng, to: LatLng): number {
  const R = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function estimateFare(distanceKm: number): {
  baseFare: number;
  distanceFare: number;
  total: number;
} {
  const baseFare = 50; // NPR 50 base
  const perKm = 30; // NPR 30 per km
  const distanceFare = Math.round(distanceKm * perKm);
  return {
    baseFare,
    distanceFare,
    total: baseFare + distanceFare,
  };
}

export function estimateDuration(distanceKm: number): number {
  // Average auto speed: ~20 km/h in city
  return Math.max(3, Math.round((distanceKm / 20) * 60));
}
