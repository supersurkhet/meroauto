import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithAuth } from "convex/react";

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud";

export const convex = new ConvexReactClient(CONVEX_URL);
export { ConvexProviderWithAuth };
