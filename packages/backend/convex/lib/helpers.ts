import {
  type QueryCtx,
  type MutationCtx,
} from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../_generated/dataModel";

// ── Auth helpers ────────────────────────────────────────────────────

export async function getAuthenticatedUser(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function requireRole(ctx: QueryCtx, role: "rider" | "driver" | "admin") {
  const user = await getAuthenticatedUser(ctx);
  if (user.role !== role && user.role !== "admin") {
    throw new Error(`Requires ${role} role`);
  }
  return user;
}

export async function requireAdmin(ctx: QueryCtx) {
  return requireRole(ctx, "admin");
}

export async function getDriverProfile(ctx: QueryCtx, userId: Id<"users">) {
  const driver = await ctx.db
    .query("drivers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!driver) throw new Error("Driver profile not found");
  return driver;
}

export async function getRiderProfile(ctx: QueryCtx, userId: Id<"users">) {
  const rider = await ctx.db
    .query("riders")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!rider) throw new Error("Rider profile not found");
  return rider;
}

// ── Geo helpers ─────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Haversine distance between two lat/lng points in kilometers */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Generate a 4-digit OTP for ride verification */
export function generateOtp(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Generate a unique QR code string */
export function generateQrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MA-"; // MeroAuto prefix
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Ride state machine ──────────────────────────────────────────────

type RideStatus = Doc<"rides">["status"];

const VALID_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  requested: ["matched", "cancelled"],
  matched: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: ["rated"],
  cancelled: [],
  rated: [],
};

export function canTransition(from: RideStatus, to: RideStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: RideStatus, to: RideStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid ride transition: ${from} → ${to}`);
  }
}
