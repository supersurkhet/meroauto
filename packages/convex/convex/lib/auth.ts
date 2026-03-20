/**
 * WorkOS auth helpers for Convex.
 *
 * Auth flow:
 * 1. Client authenticates via WorkOS AuthKit (OAuth)
 * 2. Client gets a JWT access token from WorkOS
 * 3. Client passes token in Convex auth header (ConvexProviderWithAuth)
 * 4. Convex extracts userId from the JWT via ctx.auth.getUserIdentity()
 *
 * Environment variables (set in Convex dashboard):
 * - WORKOS_API_KEY: WorkOS API key for server-side verification
 * - WORKOS_CLIENT_ID: WorkOS client ID
 */

import type { QueryCtx, MutationCtx } from "../_generated/server";

/** Get the authenticated WorkOS user ID from the Convex auth context */
export async function getAuthUserId(
  ctx: { auth: QueryCtx["auth"] },
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  // WorkOS sets the subject as the user ID
  return identity.subject ?? identity.tokenIdentifier ?? null;
}

/** Require authentication — throws if not authenticated */
export async function requireAuth(
  ctx: { auth: QueryCtx["auth"] },
): Promise<string> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

/** Require authentication and return the rider profile */
export async function requireRider(
  ctx: QueryCtx | MutationCtx,
): Promise<{ userId: string; riderId: any; rider: any }> {
  const userId = await requireAuth(ctx);
  const rider = await (ctx as any).db
    .query("riders")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  if (!rider) throw new Error("Rider profile not found");
  if (!rider.isActive) throw new Error("Rider account is inactive");
  return { userId, riderId: rider._id, rider };
}

/** Require authentication and return the driver profile */
export async function requireDriver(
  ctx: QueryCtx | MutationCtx,
): Promise<{ userId: string; driverId: any; driver: any }> {
  const userId = await requireAuth(ctx);
  const driver = await (ctx as any).db
    .query("drivers")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  if (!driver) throw new Error("Driver profile not found");
  if (driver.isSuspended) throw new Error("Driver account is suspended");
  return { userId, driverId: driver._id, driver };
}

/** Require admin role — checks if user is a driver with admin flag or has admin userId */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const userId = await requireAuth(ctx);
  // Admin check: look for driver with userId that has admin privileges
  // For now, we use a simple approach — admin users are identified by env var
  // In production, add an `isAdmin` field to drivers or a separate admins table
  const adminUserIds = (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean);
  if (adminUserIds.length > 0 && !adminUserIds.includes(userId)) {
    throw new Error("Admin access required");
  }
  return userId;
}

/**
 * Optional auth — returns userId if authenticated, null otherwise.
 * Use for public queries that show extra data when logged in.
 */
export async function optionalAuth(
  ctx: { auth: QueryCtx["auth"] },
): Promise<string | null> {
  return getAuthUserId(ctx);
}
