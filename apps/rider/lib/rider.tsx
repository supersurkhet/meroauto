import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, api } from './convex';
import { useAuth } from './auth';
import type { Id } from 'convex/values';

type RiderProfile = {
  _id: any; // Id<"riders">
  userId: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  preferredLanguage: 'en' | 'ne';
  isActive: boolean;
  createdAt: number;
};

type RiderContextType = {
  rider: RiderProfile | null | undefined;
  riderId: any | null; // Id<"riders">
  isLoading: boolean;
};

const RiderContext = createContext<RiderContextType>({
  rider: undefined,
  riderId: null,
  isLoading: true,
});

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const rider = useQuery(
    api.users.getRider,
    user?.id ? { userId: user.id } : 'skip'
  );

  return (
    <RiderContext.Provider
      value={{
        rider: rider ?? null,
        riderId: rider?._id ?? null,
        isLoading: rider === undefined,
      }}
    >
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  return useContext(RiderContext);
}
