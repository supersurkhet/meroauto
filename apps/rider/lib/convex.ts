import { ConvexReactClient } from 'convex/react';

if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  console.warn("EXPO_PUBLIC_CONVEX_URL not set — Convex queries will fail");
}
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;

export const convex = new ConvexReactClient(CONVEX_URL);

/**
 * Convex API references for the rider app.
 * These reference the shared @meroauto/convex package functions.
 * Once `convex dev` generates types, replace with:
 *   import { api } from '@meroauto/convex/convex/_generated/api';
 *
 * For now we use `anyApi` so the app compiles without codegen.
 */
import { anyApi } from 'convex/server';

export const api = anyApi as any;

// Re-export hooks for convenience
export { useQuery, useMutation, useConvex } from 'convex/react';
