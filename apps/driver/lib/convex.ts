import { ConvexReactClient } from "convex/react";

if (!process.env.EXPO_PUBLIC_CONVEX_URL) {
  console.warn("EXPO_PUBLIC_CONVEX_URL not set — Convex queries will fail");
}

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL!;

export const convex = new ConvexReactClient(CONVEX_URL);
